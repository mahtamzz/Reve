import { ApiError } from "@/api/client";
import { normalizeError } from "@/errors/normalizeError";

import * as AuthToken from "@/utils/authToken";

type ListParams = { limit?: number; offset?: number };

export type AdminGroupsListResult<T = any> = {
  items: T[];
  meta?: any | null;
};

const GROUPS_BASE =
  (import.meta as any).env?.VITE_API_GROUPS_BASE || "http://localhost:3002/api";

function stripTrailingSlashes(url: string) {
  return url.replace(/\/+$/, "");
}

function buildUrl(path: string) {
  const base = stripTrailingSlashes(GROUPS_BASE);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function getAdminTokenMaybe(): string | null {
  const getAny = (AuthToken as any).getAccessToken as any;
  if (typeof getAny === "function") {
    try {
      // اگر نسخه scope داشت
      if (getAny.length >= 1) return getAny("admin");
      // اگر نسخه قدیمی بود
      return getAny();
    } catch {
      try {
        return getAny();
      } catch {
        // ignore
      }
    }
  }

  try {
    const t = localStorage.getItem("token");
    return t || null;
  } catch {
    return null;
  }
}

async function parseRes(res: Response) {
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  return await res.text().catch(() => null);
}

async function adminGroupsFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminTokenMaybe();

  const headers: HeadersInit = { ...(init.headers || {}) };
  if (token && (headers as any).Authorization == null) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  const data = await parseRes(res);

  if (!res.ok) {
    throw new ApiError(
      normalizeError({
        status: res.status,
        code: (data as any)?.code,
        message: (data as any)?.message || (data as any)?.error || "Request failed",
        details: (data as any)?.details ?? data,
        raw: { response: { status: res.status, data } },
      })
    );
  }

  return data as T;
}

function unwrapList(res: any): AdminGroupsListResult {
  if (Array.isArray(res)) return { items: res, meta: null };
  if (Array.isArray(res?.data)) return { items: res.data, meta: res.meta ?? null };
  return { items: [], meta: null };
}

export const adminGroupsApi = {
  listAll: async (params: ListParams = {}) => {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));

    const res = await adminGroupsFetch<any>(`/groups/admin/groups?${sp.toString()}`, {
      method: "GET",
    });

    return unwrapList(res);
  },

  deleteGroup: async (groupId: string) => {
    await adminGroupsFetch<unknown>(`/groups/${groupId}`, {
      method: "DELETE",
    });
    return true;
  },
};
