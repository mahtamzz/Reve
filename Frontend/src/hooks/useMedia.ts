// src/hooks/useMedia.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiAvatarMeta } from "@/api/types";
import { deleteAvatar, getAvatarMeta, getAvatarUrl, uploadAvatar } from "@/api/media";

type UseMediaState = {
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  meta: ApiAvatarMeta | null;
  avatarUrl: string;
};

export function useMedia(autoLoad: boolean = true) {
  const [state, setState] = useState<UseMediaState>(() => ({
    loading: false,
    uploading: false,
    deleting: false,
    error: null,
    meta: null,
    avatarUrl: getAvatarUrl(),
  }));

  const loadMeta = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const meta = await getAvatarMeta();
      setState((s) => ({ ...s, meta, loading: false, avatarUrl: getAvatarUrl() }));
      return meta;
    } catch (e: any) {
      setState((s) => ({ ...s, meta: null, loading: false, error: e?.message || "Error" }));
      return null;
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setState((s) => ({ ...s, uploading: true, error: null }));
    try {
      const meta = await uploadAvatar(file);
      setState((s) => ({
        ...s,
        meta,
        uploading: false,
        avatarUrl: getAvatarUrl({ bustCache: true }),
      }));
      return meta;
    } catch (e: any) {
      setState((s) => ({ ...s, uploading: false, error: e?.message || "Error" }));
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
        avatarUrl: getAvatarUrl({ bustCache: true }),
      }));
    } catch (e: any) {
      setState((s) => ({ ...s, deleting: false, error: e?.message || "Error" }));
      throw e;
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadMeta();
  }, [autoLoad, loadMeta]);

  return useMemo(
    () => ({
      ...state,
      loadMeta,
      upload,
      remove,
      refreshAvatar: () => setState((s) => ({ ...s, avatarUrl: getAvatarUrl({ bustCache: true }) })),
    }),
    [state, loadMeta, upload, remove]
  );
}
