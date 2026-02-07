// src/utils/authSession.ts
import { clearAccessToken, type TokenScope } from "@/utils/authToken";
import { authApi } from "@/api/auth";

async function safeCall(p: Promise<any>) {
  try { await p; } catch { /* ignore */ }
}

export const authSession = {
  async logoutUser() {
    clearAccessToken("user");
    await safeCall(authApi.logout());
    window.location.href = "/login?loggedOut=true";
  },

  async logoutAdmin() {
    clearAccessToken("admin");
    await safeCall(authApi.logout());
    window.location.href = "/admin/login?loggedOut=true";
  },

  async logoutAll() {
    clearAccessToken();
    await safeCall(authApi.logout());
    window.location.href = "/login?loggedOut=true";
  },

  clear(scope?: TokenScope) {
    clearAccessToken(scope);
  },
};
