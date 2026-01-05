// src/hooks/useFollowStatus.ts
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";

export const followStatusKey = (uid: number) => ["profile", "followStatus", uid] as const;

export function useFollowStatus(uid?: number) {
  return useQuery({
    queryKey: uid ? followStatusKey(uid) : ["profile", "followStatus", "missing"],
    queryFn: () => profileSocialApi.followStatus(uid as number),
    enabled: Number.isFinite(uid),
    staleTime: 10_000,
    retry: false,
  });
}
