// src/utils/authToken.ts
export type TokenScope = "user" | "admin";

const mem: Record<TokenScope, string | null> = {
  user: null,
  admin: null,
};

export function setAccessToken(token: string | null, scope: TokenScope = "user") {
  mem[scope] = token;
}

export function getAccessToken(scope: TokenScope = "user"): string | null {
  return mem[scope];
}

export function clearAccessToken(scope?: TokenScope) {
  if (scope) mem[scope] = null;
  else {
    mem.user = null;
    mem.admin = null;
  }
}

export async function logout() {
  clearAccessToken("user");
  window.location.href = "/login?loggedOut=true";
}

export async function logout_admin() {
  clearAccessToken("admin");
  window.location.href = "/admin/login?loggedOut=true";
}
