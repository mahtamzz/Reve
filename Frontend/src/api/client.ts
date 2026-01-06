// src/api/client.ts
import { getAccessToken, setAccessToken } from "@/utils/authToken";

export class ApiError<T = unknown> extends Error {
  status?: number;
  details?: T;

  constructor(message: string, status?: number, details?: T) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

/**
 * Auth base (refresh endpoint lives here)
 * IMPORTANT: this service must implement POST /auth/refresh-token
 */
const AUTH_BASE = stripTrailingSlashes(
  import.meta.env.VITE_API_AUTH_BASE || "http://localhost:3000/api"
);

const REFRESH_PATH = "/auth/refresh-token";
const REFRESH_URL = `${AUTH_BASE}${REFRESH_PATH}`;

let refreshPromise: Promise<boolean> | null = null;

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

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data: any = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) return false;

    const token = extractToken(data);
    if (token) setAccessToken(token);

    // even if token not returned, cookie-based refresh might still have worked
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

type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean; // default true
  retry?: boolean; // default true (retry once after refresh on 401)
  body?: any;
  timeoutMs?: number;
};

export function createApiClient(rawBase: string) {
  const API_BASE_URL = stripTrailingSlashes(rawBase);

  function buildUrl(path: string) {
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function isRefreshRequest(path: string) {
    return path === REFRESH_PATH || path.endsWith(REFRESH_PATH);
  }

  async function parseBody(res: Response) {
    if (res.status === 204) return null;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      return await res.json().catch(() => null);
    }

    return await res.text().catch(() => null);
  }

  async function parseOrThrow<T>(res: Response): Promise<T> {
    const data: any = await parseBody(res);

    if (!res.ok) {
      const msgRaw =
        data?.message ||
        data?.error ||
        (typeof data === "string" && data.trim() ? data : "Request failed");

      const msg =
        typeof msgRaw === "string" && msgRaw.includes("<!DOCTYPE html")
          ? "SERVER_ERROR_HTML_RESPONSE"
          : msgRaw;

      throw new ApiError(msg, res.status, data);
    }

    return data as T;
  }

  async function apiFetch<T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { auth = true, retry = true, headers, body, timeoutMs, ...rest } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const finalHeaders: HeadersInit = { ...(headers || {}) };

    const token = getAccessToken();
    if (auth && token && (finalHeaders as any).Authorization == null) {
      (finalHeaders as any).Authorization = `Bearer ${token}`;
    }

    // Do NOT set Content-Type for FormData; browser sets boundary.
    if (!isFormData && body != null && (finalHeaders as any)["Content-Type"] == null) {
      (finalHeaders as any)["Content-Type"] = "application/json";
    }

    const controller = timeoutMs ? new AbortController() : null;
    const timeoutId = timeoutMs ? window.setTimeout(() => controller?.abort(), timeoutMs) : null;

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
      const res = await fetch(url, finalOptions);

      // auto refresh once
      if (res.status === 401 && auth && retry && !isRefreshRequest(path)) {
        const ok = await refreshOnce();
        if (!ok) throw new ApiError("UNAUTHENTICATED", 401);

        const newToken = getAccessToken();
        const retryHeaders: HeadersInit = { ...(finalHeaders as any) };
        if (newToken) (retryHeaders as any).Authorization = `Bearer ${newToken}`;

        const retryRes = await fetch(url, { ...finalOptions, headers: retryHeaders });
        return parseOrThrow<T>(retryRes);
      }

      return parseOrThrow<T>(res);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  }

  const apiClient = {
    get: <T>(path: string, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "GET" }),

    post: <T>(path: string, body?: any, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "POST", body }),

    patch: <T>(path: string, body?: any, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "PATCH", body }),

    delete: <T>(path: string, opts?: RequestOptions) =>
      apiFetch<T>(path, { ...opts, method: "DELETE" }),
  };

  return { apiFetch, apiClient };
}

// ---- bases (must match your gateway/services) ----
const PROFILE_BASE = import.meta.env.VITE_API_PROFILE_BASE || "http://localhost:3001/api";
const GROUPS_BASE = import.meta.env.VITE_API_GROUPS_BASE || "http://localhost:3002/api";
const STUDY_BASE = import.meta.env.VITE_API_STUDY_BASE || "http://localhost:3003/api";

// ✅ per swagger: http://localhost:3004 + prefix /api/media
const MEDIA_BASE = import.meta.env.VITE_API_MEDIA_BASE || "http://localhost:3004/api/media";

export const profileClient = createApiClient(PROFILE_BASE).apiClient;
export const groupsClient = createApiClient(GROUPS_BASE).apiClient;
export const studyClient = createApiClient(STUDY_BASE).apiClient;
export const mediaClient = createApiClient(MEDIA_BASE).apiClient;
export const authClient = createApiClient(AUTH_BASE).apiClient;
