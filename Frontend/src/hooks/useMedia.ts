import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiAvatarMeta } from "@/api/types";
import { deleteAvatar, getAvatarMeta, getAvatarUrl, uploadAvatar } from "@/api/media";
import { DEFAULT_AVATAR_URL } from "@/constants/avatar";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

type UseMediaState = {
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  error: string | null;
  meta: (ApiAvatarMeta & { exists?: boolean }) | null;
  avatarUrl: string;
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useMedia(autoLoad: boolean = true) {
  const ui = useUiAdapters();
  const uiRef = useRef(ui);
  useEffect(() => {
    uiRef.current = ui;
  }, [ui]);

  const lastHandledRef = useRef<unknown>(null);

  const [state, setState] = useState<UseMediaState>(() => ({
    loading: false,
    uploading: false,
    deleting: false,
    error: null,
    meta: null,
    avatarUrl: DEFAULT_AVATAR_URL,
  }));

  const showErr = useCallback((e: unknown, retry?: () => void) => {
    if (lastHandledRef.current === e) return;
    lastHandledRef.current = e;

    const err = asNormalized(e);
    setState((s) => ({ ...s, error: err.message ?? "Error" }));
    handleUiError(err, uiRef.current, retry ? { retry } : undefined);
  }, []);

  const loadingMetaRef = useRef(false);

  const loadMeta = useCallback(async () => {
    if (loadingMetaRef.current) return state.meta ?? null;

    loadingMetaRef.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const meta = await getAvatarMeta();
      setState((s) => ({
        ...s,
        meta,
        loading: false,
        avatarUrl: meta?.exists ? getAvatarUrl({ bustCache: false }) : DEFAULT_AVATAR_URL,
      }));
      return meta;
    } catch (e) {
      setState((s) => ({
        ...s,
        meta: null,
        loading: false,
        avatarUrl: DEFAULT_AVATAR_URL,
      }));
      showErr(e, loadMeta);
      return null;
    } finally {
      loadingMetaRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showErr]); // intentionally stable

  const upload = useCallback(
    async (file: File) => {
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
      } catch (e) {
        setState((s) => ({ ...s, uploading: false }));
        showErr(e, () => void upload(file));
        throw e;
      }
    },
    [showErr]
  );

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
    } catch (e) {
      setState((s) => ({ ...s, deleting: false }));
      showErr(e, remove);
      throw e;
    }
  }, [showErr]);

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
