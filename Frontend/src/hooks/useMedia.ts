import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiAvatarMeta } from "@/api/types";
import { deleteAvatar, getAvatarMeta, getAvatarUrl, uploadAvatar } from "@/api/media";
import { DEFAULT_AVATAR_URL } from "@/constants/avatar";

type UseMediaState = {
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  meta: (ApiAvatarMeta & { exists?: boolean }) | null;
  avatarUrl: string;
};

function normalizeErr(e: any) {
  return e?.details?.message || e?.message || "Error";
}

export function useMedia(autoLoad: boolean = true) {
  const [state, setState] = useState<UseMediaState>(() => ({
    loading: false,
    uploading: false,
    deleting: false,
    error: null,
    meta: null,
    // ✅ مهم: دیفالت، نه /api/media/avatar
    avatarUrl: DEFAULT_AVATAR_URL,
  }));

  const loadMeta = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const meta = await getAvatarMeta();
      setState((s) => ({
        ...s,
        meta,
        loading: false,
        // ✅ فقط اگر هست، URL واقعی بده
        avatarUrl: meta?.exists ? getAvatarUrl({ bustCache: true }) : DEFAULT_AVATAR_URL,
      }));
      return meta;
    } catch (e: any) {
      setState((s) => ({
        ...s,
        meta: null,
        loading: false,
        error: normalizeErr(e),
        avatarUrl: DEFAULT_AVATAR_URL,
      }));
      return null;
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setState((s) => ({ ...s, uploading: true, error: null }));
    try {
      const meta = await uploadAvatar(file);
      setState((s) => ({
        ...s,
        meta: { ...(meta as any), exists: true },
        uploading: false,
        avatarUrl: getAvatarUrl({ bustCache: true }),
      }));
      return meta;
    } catch (e: any) {
      setState((s) => ({ ...s, uploading: false, error: normalizeErr(e) }));
      throw e;
    }
  }, []);

  const remove = useCallback(async () => {
    setState((s) => ({ ...s, deleting: true, error: null }));
    try {
      await deleteAvatar();
      setState((s) => ({
        ...s,
        meta: null,
        deleting: false,
        avatarUrl: DEFAULT_AVATAR_URL,
      }));
    } catch (e: any) {
      setState((s) => ({ ...s, deleting: false, error: normalizeErr(e) }));
      throw e;
    }
  }, []);

  const refreshAvatar = useCallback(() => {
    setState((s) => ({
      ...s,
      avatarUrl: s.meta?.exists ? getAvatarUrl({ bustCache: true }) : DEFAULT_AVATAR_URL,
    }));
  }, []);

  useEffect(() => {
    if (autoLoad) void loadMeta();
  }, [autoLoad, loadMeta]);

  return useMemo(
    () => ({ ...state, loadMeta, upload, remove, refreshAvatar }),
    [state, loadMeta, upload, remove, refreshAvatar]
  );
}
