import { mediaClient } from "@/api/client";
import type { ApiAvatarMeta } from "@/api/types";

const UPLOAD_FIELD_NAME = "file";

const ENDPOINTS = {
  upload: "/avatar",
  remove: "/avatar",
  file: "/avatar",
  userFile: (uid: string | number) => `/users/${encodeURIComponent(String(uid))}/avatar`,
};

function stripTrailingSlashes(url: string) {
  return String(url).replace(/\/+$/, "");
}

function getMediaBase(): string {
  return stripTrailingSlashes(
    (import.meta as any).env?.VITE_API_MEDIA_BASE || "http://localhost:3004/api/media"
  );
}

export async function uploadAvatar(file: File): Promise<ApiAvatarMeta> {
  const form = new FormData();
  form.append(UPLOAD_FIELD_NAME, file);
  // backend returns 201 JSON
  return mediaClient.post<ApiAvatarMeta>(ENDPOINTS.upload, form);
}

export async function deleteAvatar(): Promise<void> {
  // backend returns 204
  await mediaClient.delete<void>(ENDPOINTS.remove);
}

export function getAvatarUrl(opts?: { bustCache?: boolean }) {
  const base = getMediaBase();
  const url = new URL(`${base}${ENDPOINTS.file}`);
  if (opts?.bustCache) url.searchParams.set("t", String(Date.now()));
  return url.toString();
}

export function getUserAvatarUrl(uid: string | number, opts?: { bustCache?: boolean }) {
  const base = getMediaBase();
  const url = new URL(`${base}${ENDPOINTS.userFile(uid)}`);
  if (opts?.bustCache) url.searchParams.set("t", String(Date.now()));
  return url.toString();
}

export async function getAvatarMeta(): Promise<(ApiAvatarMeta & { exists?: boolean }) | null> {
  const url = getAvatarUrl({ bustCache: false });

  try {
    const res = await fetch(url, {
      method: "HEAD",
      credentials: "include",
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    return { exists: true } as any;
  } catch {
    return null;
  }
}
