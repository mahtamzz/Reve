// src/hooks/useConnectionsLists.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import {
  followersListKey,
  followingListKey,
  followCountsKey,
} from "./useFollowMutations";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

function safeUid(uid?: number) {
  return typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;
}

export function useFollowers(uid?: number, params?: { limit?: number; offset?: number }) {
  const ui = useUiAdapters();
  const u = safeUid(uid);
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  const q = useQuery({
    queryKey: u ? [...followersListKey(u), limit, offset] : ["profile", "followers", "missing"],
    enabled: !!u,
    queryFn: () =>
      profileSocialApi.followers(u!, {
        limit,
        offset,
        includeProfiles: true,
      }),
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
  const u = safeUid(uid);
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  const q = useQuery({
    queryKey: u ? [...followingListKey(u), limit, offset] : ["profile", "following", "missing"],
    enabled: !!u,
    queryFn: () =>
      profileSocialApi.following(u!, {
        limit,
        offset,
        includeProfiles: true,
      }),
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
  const u = safeUid(uid);

  const q = useQuery({
    queryKey: u ? followCountsKey(u) : ["profile", "followCounts", "missing"],
    enabled: !!u,
    queryFn: () => profileSocialApi.followCounts(u!),
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
