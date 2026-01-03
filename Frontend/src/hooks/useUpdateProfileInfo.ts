// src/hooks/useUpdateProfileInfo.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileInfoApi, type UpdateProfileInfoPayload } from "@/api/profileInfo";
import { profileInfoMeKey } from "./useProfileInfoMe";
import { profileInfoDashboardKey } from "./useProfileInfoDashboard";

export function useUpdateProfileInfo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInfoPayload) => profileInfoApi.updateProfileInfo(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileInfoMeKey });
      await qc.invalidateQueries({ queryKey: profileInfoDashboardKey });
    },
  });
}
