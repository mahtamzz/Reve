// src/api/auth.ts
import { authClient, adminAuthClient } from "@/api/client";
import type { User, Admin, ApiOk } from "@/api/types";

export type LoginBody = { email: string; password: string };

export const authApi = {
  // user
  me: () => authClient.get<{ user: User }>("/auth/me"),
  login: (body: LoginBody) => authClient.post<{ user: User }>("/auth/login", body),
  logout: () => authClient.post<ApiOk>("/auth/logout"),
  refresh: () => authClient.post<{ user?: User }>("/auth/refresh-token"),

  // admin
  adminLogin: (body: LoginBody) => adminAuthClient.post<{ admin: Admin }>("/auth/admin/login", body),
  adminMe: () => adminAuthClient.get<{ admin: Admin }>("/auth/admin/me"),
  adminForgotPassword: (body: { email: string }) =>
    adminAuthClient.post<{ message: string }>("/auth/admin/forgot-password", body),
  adminResetPassword: (body: { email: string; otp: string; newPassword: string }) =>
    adminAuthClient.post<{ admin: Admin }>("/auth/admin/reset-password", body),

  // admin actions
  adminListUsers: (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return adminAuthClient.get<any>(`/auth/admin/users${qs}`);
  },
  adminDeleteUser: (id: number | string) =>
    adminAuthClient.delete<ApiOk | void>(`/auth/admin/users/${id}`),
};
