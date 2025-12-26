// src/api/media.ts
import { mediaClient } from "./client";
import type { ApiAvatarMeta } from "./types";

const UPLOAD_FIELD_NAME = "avatar";


const ENDPOINTS = {
  upload: "/media/avatar",
  meta: "/media/avatar/meta",
  remove: "/media/avatar",
  file: "/media/avatar",
};

export async function uploadAvatar(file: File): Promise<ApiAvatarMeta> {
  const form = new FormData();
  form.append(UPLOAD_FIELD_NAME, file);

  return mediaClient.post<ApiAvatarMeta>(ENDPOINTS.upload, form);
}

export async function getAvatarMeta(): Promise<ApiAvatarMeta> {
  return mediaClient.get<ApiAvatarMeta>(ENDPOINTS.meta);
}

export async function deleteAvatar(): Promise<void> {
  await mediaClient.delete<void>(ENDPOINTS.remove);
}

export function getAvatarUrl(opts?: { bustCache?: boolean }) {
  const base = (import.meta as any).env?.VITE_API_MEDIA_BASE || "http://localhost:3004/api";
  const origin = base.replace(/\/api\/?$/, ""); // http://localhost:3004
  const url = new URL(`${origin}/api${ENDPOINTS.file}`); // => http://localhost:3004/api/media/avatar

  if (opts?.bustCache) url.searchParams.set("t", String(Date.now()));
  return url.toString();
}
