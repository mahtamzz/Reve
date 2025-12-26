import { authClient } from "@/api/client";
import type { User, ApiOk } from "@/api/types";

export type LoginBody = { email: string; password: string };

export const authApi = {
  me: () => authClient.get<User>("/auth/me"),
  login: (body: LoginBody) => authClient.post<User>("/auth/login", body),
  logout: () => authClient.post<ApiOk>("/auth/logout"),
};
