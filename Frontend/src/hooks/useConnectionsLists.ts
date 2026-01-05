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
  return useQuery({
    queryKey: uid ? followCountsKey(uid) : ["profile", "followCounts", "missing"],
    queryFn: () => profileSocialApi.followCounts(uid as number),
    enabled: Number.isFinite(uid),
    staleTime: 10_000,
    retry: false,
  });
}
