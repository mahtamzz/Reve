// src/hooks/useConnectionsLists.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { followersListKey, followingListKey, followCountsKey } from "./useFollowMutations";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useFollowers(uid?: number, params?: { limit?: number; offset?: number }) {
  const ui = useUiAdapters();

  const q = useQuery({
    queryKey: uid
      ? [...followersListKey(uid), params?.limit ?? 50, params?.offset ?? 0]
      : ["profile", "followers", "missing"],
    queryFn: () =>
      profileSocialApi.followers(uid as number, {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        includeProfiles: true,
      }),
    enabled: Number.isFinite(uid),
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    if (q.isError && q.error) {
      handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
    }
  }, [q.isError, q.error, q.refetch, ui]);

  return q;
}

export function useFollowing(uid?: number, params?: { limit?: number; offset?: number }) {
  const ui = useUiAdapters();

  const q = useQuery({
    queryKey: uid
      ? [...followingListKey(uid), params?.limit ?? 50, params?.offset ?? 0]
      : ["profile", "following", "missing"],
    queryFn: () =>
      profileSocialApi.following(uid as number, {
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        includeProfiles: true,
      }),
    enabled: Number.isFinite(uid),
    staleTime: 10_000,
    retry: false,
  });

  useEffect(() => {
    if (q.isError && q.error) {
      handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
    }
  }, [q.isError, q.error, q.refetch, ui]);

  return q;
}

export function useFollowCounts(uid?: number) {
  const ui = useUiAdapters();

  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;

  const q = useQuery({
    queryKey: ["followCounts", safeUid],
    enabled: !!safeUid,
    queryFn: () => profileSocialApi.followCounts(safeUid!),
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
