import { useQuery } from "@tanstack/react-query";
import { profileInfoApi } from "@/api/profileInfo";

export const profileInfoDashboardKey = ["profileInfo", "dashboard"] as const;

export function useProfileInfoDashboard() {
  return useQuery({
    queryKey: profileInfoDashboardKey,
    queryFn: profileInfoApi.getDashboard,
  });
}
