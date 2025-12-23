// src/auth/authToken.ts
let accessToken: string | null = null;

export const authToken = {
  setAccessToken(token: string | null) {
    accessToken = token;
  },
  getAccessToken() {
    return accessToken;
  },
  clear() {
    accessToken = null;
  }
};
