// src/hooks/useProfileMe.ts
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileInfoApi } from "@/api/profileInfo";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

export const profileMeKey = ["profile", "me"] as const;

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useProfileMe() {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  const q = useQuery({
    queryKey: profileMeKey,
    queryFn: profileInfoApi.getMe,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!q.isError || !q.error) return;
    if (lastHandledRef.current === q.error) return;
    lastHandledRef.current = q.error;

    handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
  }, [q.isError, q.error, q.refetch, ui]);

  return q;
}
