// src/api/adminAuth.ts
import { authClient } from "@/api/client";
import type { Admin } from "@/api/types";

export type AdminLoginBody = { email: string; password: string };

export type ListUsersParams = { page?: number; limit?: number };

export type ListUsersResponse = {
  data: any[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

function unwrapAdmin(res: any): Admin {
  return (res?.admin ?? res) as Admin;
}

export const adminAuthApi = {
  // session
  me: async () => unwrapAdmin(await authClient.get("/auth/admin/me", { retry: false })),

  // ✅ ADD: login
  login: async (body: AdminLoginBody) =>
    unwrapAdmin(await authClient.post("/auth/admin/login", body, { retry: false })),

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
