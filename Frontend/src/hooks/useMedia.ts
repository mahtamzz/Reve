// src/hooks/useMedia.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiAvatarMeta } from "@/api/types";
import { deleteAvatar, getAvatarMeta, getAvatarUrl, uploadAvatar } from "@/api/media";

type UseMediaState = {
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;

  // ✅ چون بک meta واقعی نداره، این یا null میشه یا { exists: true }
  meta: (ApiAvatarMeta & { exists?: boolean }) | null;

  // ✅ برای <img src>
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
      const meta = await uploadAvatar(file); // ✅ بک 201 json
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
      await deleteAvatar(); // ✅ بک 204
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

  useEffect(() => {
    if (autoLoad) loadMeta();
  }, [autoLoad, loadMeta]);

  return useMemo(
    () => ({
      ...state,
      loadMeta,
      upload,
      remove,
      refreshAvatar: () =>
        setState((s) => ({ ...s, avatarUrl: getAvatarUrl({ bustCache: true }) })),
    }),
    [state, loadMeta, upload, remove]
  );
}
