// src/hooks/useFollowStatus.ts
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";

export const followStatusKey = (uid?: number) => {
  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;
  return ["followStatus", safeUid] as const;
};

export function useFollowStatus(uid?: number) {
  const safeUid = typeof uid === "number" && Number.isFinite(uid) && uid > 0 ? uid : undefined;

  return useQuery({
    queryKey: followStatusKey(safeUid),
    enabled: !!safeUid,
    queryFn: () => profileSocialApi.followStatus(safeUid!),
    staleTime: 15_000,
    retry: (count, err: any) => {
      const status = err?.status;
      if (status && status >= 400 && status < 500) return false;
      return count < 2;
    },
  });
}
