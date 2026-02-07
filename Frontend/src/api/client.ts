// src/api/client.ts
import { getAccessToken, setAccessToken, type TokenScope } from "@/utils/authToken";
import { normalizeError } from "@/errors/normalizeError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ERROR_DICTIONARY } from "@/errors/errorDictionary";
import type { ErrorDef } from "@/errors/errorDictionary";

export class ApiError<T = unknown> extends Error implements NormalizedError {
  code!: ErrorDef["code"];
  type!: ErrorDef["type"];
  severity!: ErrorDef["severity"];
  title?: ErrorDef["title"];
  message!: ErrorDef["message"];
  ui!: ErrorDef["ui"];
  show!: ErrorDef["show"];
  retryable!: ErrorDef["retryable"];
  action!: ErrorDef["action"];
  report!: ErrorDef["report"];

  status?: number;
  requestId?: string;
  details?: T;
  raw?: unknown;

  constructor(n: NormalizedError) {
    super(n.message);
    this.name = "ApiError";
    Object.assign(this, n);
    this.message = n.message;
  }

  static from(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    return new ApiError(normalizeError(err));
  }
}

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

type AuthMode = "cookie" | "bearer";

type CreateClientOptions = {
  authMode?: AuthMode;               // default: "bearer"
  tokenScope?: TokenScope;           // default: "user"

  // اگر refreshBase null/undefined باشد refresh کلاً خاموش است
  refreshBase?: string | null;       // e.g. "/api" or "https://api.example.com"
  refreshPath?: string;              // default "/auth/refresh-token"
};

type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;                    // include credentials / attach bearer
  retry?: boolean;                   // auto refresh-on-401 (disabled for login)
  body?: any;
  timeoutMs?: number;
};

function extractToken(data: any): string | null {
  if (!data) return null;
  return (
    data.token ||
    data.accessToken ||
    data.access_token ||
    data?.data?.token ||
    data?.data?.accessToken ||
    data?.data?.access_token ||
    null
  );
}

export function createApiClient(rawBase: string, opts: CreateClientOptions = {}) {
  const API_BASE_URL = stripTrailingSlashes(rawBase);

  const authMode: AuthMode = opts.authMode ?? "bearer";
  const tokenScope: TokenScope = opts.tokenScope ?? "user";

  const refreshPath = opts.refreshPath ?? "/auth/refresh-token";

  const refreshBase =
    opts.refreshBase == null ? null : stripTrailingSlashes(String(opts.refreshBase));
  const refreshUrl = refreshBase ? `${refreshBase}${refreshPath}` : null;

  let refreshPromise: Promise<boolean> | null = null;

  function buildUrl(path: string) {
    const p = path.startsWith("/") ? path : `/${path}`;
    // اگر base نسبی بود (مثل "/api") خروجی هم نسبی می‌ماند و same-origin می‌شود
    return `${API_BASE_URL}${p}`;
  }

  function isRefreshRequest(path: string) {
    return path === refreshPath || path.endsWith(refreshPath);
  }

  async function parseBody(res: Response) {
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) return await res.json().catch(() => null);
    return await res.text().catch(() => null);
  }

  function requestIdFrom(res: Response): string | undefined {
    return (
      res.headers.get("x-request-id") ||
      res.headers.get("x-correlation-id") ||
      res.headers.get("x-trace-id") ||
      undefined
    );
  }

  function toApiShape(params: {
    status?: number;
    data?: any;
    requestId?: string;
    fallbackMessage?: string;
  }) {
    const { status, data, requestId, fallbackMessage } = params;

    const code =
      typeof data?.code === "string"
        ? data.code
        : typeof data?.errorCode === "string"
          ? data.errorCode
          : undefined;

    const backendMsg =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : typeof data === "string"
            ? data
            : fallbackMessage;

    const looksLikeHtml =
      typeof backendMsg === "string" && backendMsg.includes("<!DOCTYPE html");

    return {
      code: looksLikeHtml ? "SERVER_ERROR" : code,
      status,
      message: looksLikeHtml ? "SERVER_ERROR_HTML_RESPONSE" : backendMsg,
      details: data?.details ?? data,
      requestId,
    };
  }

  async function parseOrThrow<T>(res: Response): Promise<T> {
    const data: any = await parseBody(res);

    if (!res.ok) {
      const apiShape = toApiShape({
        status: res.status,
        data,
        requestId: requestIdFrom(res),
        fallbackMessage: "Request failed",
      });

      throw new ApiError(
        normalizeError({
          ...apiShape,
          raw: { response: { status: res.status, data }, requestId: apiShape.requestId },
        })
      );
    }

    return data as T;
  }

  async function doRefresh(): Promise<boolean> {
    if (!refreshUrl) return false;

    try {
      const res = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data: any = isJson ? await res.json().catch(() => null) : null;

      if (!res.ok) return false;

      // اگر بک تو body توکن داد (bearer-mode) ذخیره کن (اختیاری)
      const token = extractToken(data);
      if (token) setAccessToken(token, tokenScope);

      return true;
    } catch {
      return false;
    }
  }

  async function refreshOnce(): Promise<boolean> {
    if (!refreshPromise) refreshPromise = doRefresh();
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { auth = true, retry = true, headers, body, timeoutMs, ...rest } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const finalHeaders: HeadersInit = { ...(headers || {}) };

    // bearer-mode: Authorization
    if (auth && authMode === "bearer") {
      const token = getAccessToken(tokenScope);
      if (token && (finalHeaders as any).Authorization == null) {
        (finalHeaders as any).Authorization = `Bearer ${token}`;
      }
    }

    if (!isFormData && body != null && (finalHeaders as any)["Content-Type"] == null) {
      (finalHeaders as any)["Content-Type"] = "application/json";
    }

    const controller = timeoutMs ? new AbortController() : null;
    let timedOut = false;

    const timeoutId =
      timeoutMs != null
        ? window.setTimeout(() => {
            timedOut = true;
            controller?.abort();
          }, timeoutMs)
        : null;

    try {
      const finalOptions: RequestInit = {
        ...rest,
        headers: finalHeaders,
        credentials: auth ? "include" : "omit",
        signal: controller?.signal,
        body:
          body == null
            ? undefined
            : isFormData
              ? body
              : typeof body === "string"
                ? body
                : JSON.stringify(body),
      };

      const url = buildUrl(path);

      let res: Response;
      try {
        res = await fetch(url, finalOptions);
      } catch (err) {
        if (timedOut) throw new ApiError({ ...ERROR_DICTIONARY.NETWORK_TIMEOUT, raw: err });
        throw ApiError.from(err);
      }

      // auto-refresh on 401 (فقط برای requestهایی که retry=true هستند)
      if (res.status === 401 && auth && retry && !isRefreshRequest(path)) {
        const ok = await refreshOnce();
        if (!ok) {
          throw new ApiError(
            normalizeError({
              status: 401,
              code: "AUTH_UNAUTHORIZED",
              message: "Unauthenticated",
            })
          );
        }

        // cookie-mode: retry همان request
        if (authMode === "cookie") {
          const retryRes = await fetch(url, finalOptions);
          return parseOrThrow<T>(retryRes);
        }

        // bearer-mode: Authorization را آپدیت کن
        const newToken = getAccessToken(tokenScope);
        const retryHeaders: HeadersInit = { ...(finalHeaders as any) };
        if (newToken) (retryHeaders as any).Authorization = `Bearer ${newToken}`;

        const retryRes = await fetch(url, { ...finalOptions, headers: retryHeaders });
        return parseOrThrow<T>(retryRes);
      }

      return parseOrThrow<T>(res);
    } catch (err) {
      throw ApiError.from(err);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  const apiClient = {
    get: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: "GET" }),
    post: <T>(path: string, body?: any, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "POST", body }),
    patch: <T>(path: string, body?: any, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "PATCH", body }),
    delete: <T>(path: string, opts?: RequestOptions) => apiFetch<T>(path, { ...opts, method: "DELETE" }),
  };

  return { apiFetch, apiClient };
}

/** ---- bases ---- **/
// ✅ مهم: پیش‌فرض را same-origin کن تا cookie ارسال شود
const AUTH_BASE = stripTrailingSlashes(import.meta.env.VITE_API_AUTH_BASE || "/api");

// این‌ها را هم بهتر است پشت proxy بیاوری؛ فعلاً اگر env ندادی same-origin می‌شوند
const PROFILE_BASE = stripTrailingSlashes(import.meta.env.VITE_API_PROFILE_BASE || "/api");
const GROUPS_BASE  = stripTrailingSlashes(import.meta.env.VITE_API_GROUPS_BASE || "/api");
const STUDY_BASE   = stripTrailingSlashes(import.meta.env.VITE_API_STUDY_BASE || "/api");
const MEDIA_BASE   = stripTrailingSlashes(import.meta.env.VITE_API_MEDIA_BASE || "/api/media");

// ✅ user: cookie mode + refresh روشن
export const authClient = createApiClient(AUTH_BASE, {
  authMode: "cookie",
  tokenScope: "user",
  refreshBase: AUTH_BASE,
}).apiClient;

// ✅ admin: cookie mode ولی refresh خاموش (چون بک admin-refresh ندارد)
export const adminAuthClient = createApiClient(AUTH_BASE, {
  authMode: "cookie",
  tokenScope: "admin",
  refreshBase: null,
}).apiClient;

export const profileClient = createApiClient(PROFILE_BASE, {
  authMode: "cookie",
  tokenScope: "user",
  refreshBase: AUTH_BASE,
}).apiClient;

export const groupsClient = createApiClient(GROUPS_BASE, {
  authMode: "cookie",
  tokenScope: "user",
  refreshBase: AUTH_BASE,
}).apiClient;

export const studyClient = createApiClient(STUDY_BASE, {
  authMode: "cookie",
  tokenScope: "user",
  refreshBase: AUTH_BASE,
}).apiClient;

export const mediaClient = createApiClient(MEDIA_BASE, {
  authMode: "cookie",
  tokenScope: "user",
  refreshBase: AUTH_BASE,
}).apiClient;
