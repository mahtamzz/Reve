// src/hooks/useUpdateProfileMe.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileInfoApi, type UpdateProfileInfoPayload } from "@/api/profileInfo";
import { profileMeKey } from "./useProfileMe";
import { profileInfoDashboardKey } from "./useProfileInfoDashboard";

export function useUpdateProfileMe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInfoPayload) => profileInfoApi.updateProfileInfo(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileMeKey });
      await qc.invalidateQueries({ queryKey: profileInfoDashboardKey });
    },
  });
}
