// src/hooks/useFollowStatus.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

export const followStatusKey = (uid?: number) => {
  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;
  return ["followStatus", safeUid] as const;
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useFollowStatus(uid?: number) {
  const ui = useUiAdapters();
  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;

  const q = useQuery({
    queryKey: followStatusKey(safeUid),
    enabled: !!safeUid,
    queryFn: () => profileSocialApi.followStatus(safeUid!),
    staleTime: 15_000,
    retry: (count, err: any) => {
      const e = asNormalized(err);
      if (e.status && e.status >= 400 && e.status < 500) return false;
      return count < 2;
    },
  });

  useEffect(() => {
    if (q.isError && q.error) {
      handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
    }
  }, [q.isError, q.error, q.refetch, ui]);

  return q;
}
