// src/hooks/useConnectionsLists.ts
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { followersListKey, followingListKey, followCountsKey } from "./useFollowMutations";

export function useFollowers(uid?: number, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: uid ? [...followersListKey(uid), params?.limit ?? 50, params?.offset ?? 0] : ["profile", "followers", "missing"],
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
}

export function useFollowing(uid?: number, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: uid ? [...followingListKey(uid), params?.limit ?? 50, params?.offset ?? 0] : ["profile", "following", "missing"],
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
}

export function useFollowCounts(uid?: number) {
  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;

  return useQuery({
    queryKey: ["followCounts", safeUid],
    enabled: !!safeUid,
    queryFn: () => profileSocialApi.followCounts(safeUid!),
    staleTime: 15_000,
    retry: (count, err: any) => {
      const status = err?.status;
      if (status && status >= 400 && status < 500) return false;
      return count < 2;
    },
  });
}