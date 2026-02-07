import { authToken } from "./authToken";

export const authSession = {
  logoutUser() {
    authToken.clear("user");
    window.location.href = "/login?loggedOut=true";
  },
  logoutAdmin() {
    authToken.clear("admin");
    window.location.href = "/admin/login?loggedOut=true";
  },
  logoutAll() {
    authToken.clear();
    window.location.href = "/login?loggedOut=true";
  },
};
