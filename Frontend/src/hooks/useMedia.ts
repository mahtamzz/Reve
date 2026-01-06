// src/hooks/useMedia.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiAvatarMeta } from "@/api/types";
import { deleteAvatar, getAvatarMeta, getAvatarUrl, uploadAvatar } from "@/api/media";

type UseMediaState = {
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;

  // backend doesn't provide a JSON meta endpoint; we only know "exists"
  meta: (ApiAvatarMeta & { exists?: boolean }) | null;

  // for <img src>
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
    avatarUrl: getAvatarUrl({ bustCache: true }),
  }));

  const loadMeta = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const meta = await getAvatarMeta();
      setState((s) => ({
        ...s,
        meta,
        loading: false,
        avatarUrl: getAvatarUrl({ bustCache: true }),
      }));
      return meta;
    } catch (e: any) {
      setState((s) => ({
        ...s,
        meta: null,
        loading: false,
        error: normalizeErr(e),
      }));
      return null;
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setState((s) => ({ ...s, uploading: true, error: null }));
    try {
      const meta = await uploadAvatar(file); // backend returns 201 JSON
      setState((s) => ({
        ...s,
        meta: meta as any,
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
      await deleteAvatar(); // backend returns 204
      setState((s) => ({
        ...s,
        meta: null,
        deleting: false,
        avatarUrl: getAvatarUrl({ bustCache: true }),
      }));
    } catch (e: any) {
      setState((s) => ({ ...s, deleting: false, error: normalizeErr(e) }));
      throw e;
    }
  }, []);

  const refreshAvatar = useCallback(() => {
    setState((s) => ({ ...s, avatarUrl: getAvatarUrl({ bustCache: true }) }));
  }, []);

  useEffect(() => {
    if (autoLoad) void loadMeta();
  }, [autoLoad, loadMeta]);

  return useMemo(
    () => ({
      ...state,
      loadMeta,
      upload,
      remove,
      refreshAvatar,
    }),
    [state, loadMeta, upload, remove, refreshAvatar]
  );
}
