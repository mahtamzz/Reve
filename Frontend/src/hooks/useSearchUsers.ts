import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";

export function useSearchUsers(q: string, opts?: { limit?: number; offset?: number; enabled?: boolean }) {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const enabled = opts?.enabled ?? true;

  const qq = (q ?? "").trim();

  return useQuery({
    queryKey: ["profile.searchUsers", qq, limit, offset],
    enabled: enabled && qq.length > 0,
    queryFn: () => profileSocialApi.searchUsers({ q: qq, limit, offset }),
    staleTime: 15_000,
  });
}
