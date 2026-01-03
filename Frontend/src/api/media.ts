// src/api/media.ts
import { mediaClient } from "./client";
import type { ApiAvatarMeta } from "./types";

const UPLOAD_FIELD_NAME = "file"; // ✅ بک: upload.single('file')

const ENDPOINTS = {
  upload: "/media/avatar",          // POST (multipart)
  remove: "/media/avatar",          // DELETE
  file: "/media/avatar",            // GET (image file)
  userFile: (uid: string | number) => `/media/users/${encodeURIComponent(String(uid))}/avatar`, // GET public
};

/**
 * Upload avatar
 * POST /api/media/avatar
 * multipart/form-data field name: file
 * returns: JSON meta row
 */
export async function uploadAvatar(file: File): Promise<ApiAvatarMeta> {
  const form = new FormData();
  form.append(UPLOAD_FIELD_NAME, file);
  return mediaClient.post<ApiAvatarMeta>(ENDPOINTS.upload, form);
}

/**
 * ✅ بک endpoint متا ندارد.
 * پس ما یک meta "حداقلی" می‌سازیم:
 * - اگر فایل وجود داشت: { exists: true }
 * - اگر نبود: null
 *
 * نکته: چون mediaClient پاسخ غیر-JSON رو parse می‌کنه و خراب میشه،
 * برای چک کردن وجود فایل از fetch خام با HEAD استفاده می‌کنیم.
 */
export async function getAvatarMeta(): Promise<(ApiAvatarMeta & { exists?: boolean }) | null> {
  const base = (import.meta as any).env?.VITE_API_MEDIA_BASE || "http://localhost:3004/api";
  const url = `${base.replace(/\/+$/, "")}${ENDPOINTS.file}`;

  try {
    const res = await fetch(url, {
      method: "HEAD",
      credentials: "include",
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    // بک meta واقعی برنمی‌گردونه؛ فقط می‌گیم هست
    return { exists: true } as any;
  } catch {
    return null;
  }
}

export async function deleteAvatar(): Promise<void> {
  await mediaClient.delete<void>(ENDPOINTS.remove);
}

/**
 * URL for <img src="...">
 * GET /api/media/avatar  (auth)
 */
export function getAvatarUrl(opts?: { bustCache?: boolean }) {
  const base = (import.meta as any).env?.VITE_API_MEDIA_BASE || "http://localhost:3004/api";
  const url = new URL(`${base.replace(/\/+$/, "")}${ENDPOINTS.file}`);

  if (opts?.bustCache) url.searchParams.set("t", String(Date.now()));
  return url.toString();
}

/**
 * URL for another user avatar (public)
 * GET /api/media/users/:uid/avatar
 */
export function getUserAvatarUrl(uid: string | number, opts?: { bustCache?: boolean }) {
  const base = (import.meta as any).env?.VITE_API_MEDIA_BASE || "http://localhost:3004/api";
  const url = new URL(`${base.replace(/\/+$/, "")}${ENDPOINTS.userFile(uid)}`);

  if (opts?.bustCache) url.searchParams.set("t", String(Date.now()));
  return url.toString();
}
