import { apiClient } from "@/api/client";
import type { User, ApiOk } from "@/api/types";

export type LoginBody = { email: string; password: string };

export const authApi = {
  me: () => apiClient.get<User>("/auth/me"),
  login: (body: LoginBody) => apiClient.post<User>("/auth/login", body),
  logout: () => apiClient.post<ApiOk>("/auth/logout"),
};
