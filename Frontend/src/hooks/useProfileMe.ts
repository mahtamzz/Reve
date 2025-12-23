import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/api/profile";

export const profileMeKey = ["profile", "me"] as const;

export function useProfileMe() {
  return useQuery({
    queryKey: profileMeKey,
    queryFn: profileApi.me,
  });
}
