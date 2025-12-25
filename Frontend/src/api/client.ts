// src/api/client.ts

import { getAccessToken } from "@/utils/authToken";

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

const REFRESH_PATH = "/auth/refresh-token";

type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;          // default true
  retry?: boolean;         // default true
  body?: any;
  timeoutMs?: number;      // optional
};

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

export function createApiClient(rawBase: string) {
  const API_BASE_URL = stripTrailingSlashes(rawBase);

  let refreshPromise: Promise<boolean> | null = null;

  function buildUrl(path: string) {
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function isRefreshRequest(path: string) {
    return path === REFRESH_PATH || path.endsWith(REFRESH_PATH);
  }

  async function doRefresh(): Promise<boolean> {
    try {
      const res = await fetch(buildUrl(REFRESH_PATH), {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
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

  async function parseJsonOrThrow<T>(res: Response): Promise<T> {
    if (res.status === 204) return null as T;

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data: any = isJson
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        (typeof data === "string" && data.trim() ? data : "Request failed");

      throw new ApiError(msg, res.status, data);
    }

    return data as T;
  }

  async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      auth = true,
      retry = true,
      headers,
      body,
      timeoutMs,
      ...rest
    } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const finalHeaders: HeadersInit = { ...(headers || {}) };

    // ✅ اگر accessToken داری، Bearer بفرست (بدون تغییر بک)
    const token = getAccessToken();
    if (auth && token && (finalHeaders as any).Authorization == null) {
      (finalHeaders as any).Authorization = `Bearer ${token}`;
    }

    if (!isFormData && body != null && (finalHeaders as any)["Content-Type"] == null) {
      (finalHeaders as any)["Content-Type"] = "application/json";
    }

    const controller = timeoutMs ? new AbortController() : null;
    const timeoutId = timeoutMs
      ? window.setTimeout(() => controller?.abort(), timeoutMs)
      : null;

    try {
      const finalOptions: RequestInit = {
        ...rest,
        headers: finalHeaders,
        // ✅ cookie-based auth هم حفظ می‌شه
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

      // ✅ اگر 401 شد، یکبار refresh و retry
      if (res.status === 401 && auth && retry && !isRefreshRequest(path)) {
        const ok = await refreshOnce();
        if (!ok) throw new ApiError("UNAUTHENTICATED", 401);

        const retryRes = await fetch(url, finalOptions);
        return parseJsonOrThrow<T>(retryRes);
      }

      return parseJsonOrThrow<T>(res);
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

// ✅ base ها
const PROFILE_BASE = import.meta.env.VITE_API_PROFILE_BASE || "http://localhost:3001/api";
const GROUPS_BASE = import.meta.env.VITE_API_GROUPS_BASE || "http://localhost:3002/api";

export const profileClient = createApiClient(PROFILE_BASE).apiClient;
export const groupsClient = createApiClient(GROUPS_BASE).apiClient;
