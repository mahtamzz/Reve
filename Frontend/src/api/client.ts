// src/api/client.ts

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
  auth?: boolean;
  retry?: boolean;
  body?: any;
};

export function createApiClient(rawBase: string) {
  const API_BASE_URL = rawBase.replace(/\/+$/, "");

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

  async function apiFetch<T = unknown>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { auth = true, retry = true, headers, body, ...rest } = options;

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const finalHeaders: HeadersInit = { ...(headers || {}) };

    if (!isFormData && body != null && (finalHeaders as any)["Content-Type"] == null) {
      (finalHeaders as any)["Content-Type"] = "application/json";
    }

    const finalOptions: RequestInit = {
      ...rest,
      headers: finalHeaders,
      credentials: auth ? "include" : "omit",
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

    if (res.status === 401 && auth && retry && !isRefreshRequest(path)) {
      const ok = await refreshOnce();
      if (!ok) throw new ApiError("UNAUTHENTICATED", 401);

      const retryRes = await fetch(url, finalOptions);
      return parseJsonOrThrow<T>(retryRes);
    }

    return parseJsonOrThrow<T>(res);
  }

  return {
    apiFetch,
    apiClient: {
      get: <T>(path: string, opts?: RequestOptions) =>
        apiFetch<T>(path, { ...opts, method: "GET" }),

      post: <T>(path: string, body?: any, opts?: RequestOptions) =>
        apiFetch<T>(path, { ...opts, method: "POST", body }),

      patch: <T>(path: string, body?: any, opts?: RequestOptions) =>
        apiFetch<T>(path, { ...opts, method: "PATCH", body }),

      delete: <T>(path: string, opts?: RequestOptions) =>
        apiFetch<T>(path, { ...opts, method: "DELETE" }),
    },
  };
}

// ✅ اینا باید بعد از createApiClient باشن
const PROFILE_BASE =
  import.meta.env.VITE_API_PROFILE_BASE || "http://localhost:3001/api";

const GROUPS_BASE =
  import.meta.env.VITE_API_GROUPS_BASE || "http://localhost:3002/api";

export const profileClient = createApiClient(PROFILE_BASE).apiClient;
export const groupsClient = createApiClient(GROUPS_BASE).apiClient;
