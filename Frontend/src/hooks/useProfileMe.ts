import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi, type UpdateProfilePayload } from "@/api/profile";

export const profileMeKey = ["profile", "me"] as const;
export const profileDashboardKey = ["profile", "dashboard"] as const;

export function useProfileMe() {
  return useQuery({
    queryKey: profileMeKey,
    queryFn: profileApi.me,
  });
}

export function useProfileDashboard() {
  return useQuery({
    queryKey: profileDashboardKey,
    queryFn: profileApi.dashboard,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.updateMe(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileMeKey });
      await qc.invalidateQueries({ queryKey: profileDashboardKey });
    },
  });
}
