// src/hooks/useProfileMe.ts
import { useQuery } from "@tanstack/react-query";
import { profileInfoApi } from "@/api/profileInfo";

export const profileMeKey = ["profile", "me"] as const;

export function useProfileMe() {
  return useQuery({
    queryKey: profileMeKey,
    queryFn: profileInfoApi.getMe,
    retry: false,
    staleTime: 30_000,
  });
}
