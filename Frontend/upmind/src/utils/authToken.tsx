// src/utils/authToken.ts

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export async function logout() {
    setAccessToken(null);
    window.location.href = "/login?loggedOut=true";
  }
  
  export async function logout_admin() {
    setAccessToken(null);
    window.location.href = "/admin/login?loggedOut=true";
  }
  