import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/api/profile";
import { profileMeKey } from "@/hooks/useProfileMe";

export function useUpdateProfileMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileMeKey });
    },
  });
}
