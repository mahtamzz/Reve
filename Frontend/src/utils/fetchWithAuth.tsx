// src/utils/fetchWithAuth.ts
import { getAccessToken, setAccessToken } from "@/utils/authToken";

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch("http://localhost:8080/api/auth/refresh-token", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      return false;
    }

    console.log("New access token from refresh:", data.token);
    setAccessToken(data.token);
    return true;
  } catch (err) {
    console.error("Refresh token error:", err);
    return false;
  }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = getAccessToken();

  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!("Content-Type" in (headers as any)) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response = await fetch(url, finalOptions);

  if (response.status === 401) {
    console.warn("Access token expired → trying refresh...");

    const refreshed = await refreshToken();

    if (!refreshed) {
      console.error("Refresh failed → unauthenticated, clearing token");
      setAccessToken(null);
      throw new Error("UNAUTHENTICATED");
    }

    token = getAccessToken();

    const retryHeaders: HeadersInit = {
      ...(finalOptions.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    response = await fetch(url, {
      ...finalOptions,
      headers: retryHeaders,
    });
  }

  return response;
}
