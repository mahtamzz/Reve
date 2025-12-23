// src/auth/authSession.ts
import { authToken } from "./authToken";

export const authSession = {
  logout() {
    authToken.clear();
    window.location.href = "/login?loggedOut=true";
  },
  logoutAdmin() {
    authToken.clear();
    window.location.href = "/admin/login?loggedOut=true";
  }
};
