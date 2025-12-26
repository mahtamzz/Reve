import { useQuery } from "@tanstack/react-query";
import { profileInfoApi } from "@/api/profileInfo";

export const profileInfoMeKey = ["profileInfo", "me"] as const;

export function useProfileInfoMe() {
  return useQuery({
    queryKey: profileInfoMeKey,
    queryFn: profileInfoApi.getMe,
  });
}
