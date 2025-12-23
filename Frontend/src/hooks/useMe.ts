import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

export const meQueryKey = ["auth", "me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
  });
}
