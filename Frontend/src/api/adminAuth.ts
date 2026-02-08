// src/api/adminAuth.ts
import { authClient, ApiError } from "@/api/client";
import type { Admin } from "@/api/types";
import { setAccessToken } from "@/utils/authToken";

export type AdminLoginBody = { email: string; password: string };

export type ListUsersParams = { page?: number; limit?: number };

export type ListUsersResponse = {
  data: any[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

function unwrapAdmin(res: any): Admin {
  return (res?.admin ?? res) as Admin;
}

async function getAdminMeLikeUser() {
  try {
    return unwrapAdmin(await authClient.get("/auth/admin/me", { retry: false }));
  } catch (e) {
    const err = ApiError.from(e);
    if (err.status === 404) {
      return unwrapAdmin(await authClient.get("/auth/me", { retry: false }));
    }
    throw err;
  }
}

export const adminAuthApi = {
  me: () => getAdminMeLikeUser(),

  login: async (body: AdminLoginBody) => {
    await authClient.post("/auth/admin/login", body, { retry: false });

    return await getAdminMeLikeUser();
  },

  logout: async () => {
    try {
      await authClient.post("/auth/admin/logout", undefined, { retry: false });
    } catch (e) {
      const err = ApiError.from(e);
      if (err.status !== 404) throw err;
      await authClient.post("/auth/logout", undefined, { retry: false });
    } finally {
      try { localStorage.removeItem("token"); } catch {}
      setAccessToken(null);
    }
  },

  // users
  listUsers: (params: ListUsersParams) => {
    const sp = new URLSearchParams();
    if (params.page != null) sp.set("page", String(params.page));
    if (params.limit != null) sp.set("limit", String(params.limit));
    const qs = sp.toString();

    return authClient.get<ListUsersResponse>(`/auth/admin/users${qs ? `?${qs}` : ""}`, {
      retry: false,
    });
  },

  deleteUser: (userId: string | number) =>
    authClient.delete<unknown>(`/auth/admin/users/${userId}`, { retry: false }),
};
