import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  profileInfoApi,
  UpdateProfileInfoPayload,
} from "@/api/profileInfo";
import { profileInfoMeKey } from "./useProfileInfoMe";

export function useUpdateProfileInfo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileInfoPayload) =>
      profileInfoApi.updateProfileInfo(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileInfoMeKey });
    },
  });
}
