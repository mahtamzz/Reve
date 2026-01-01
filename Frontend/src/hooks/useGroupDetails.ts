import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "@/api/groups";

export const groupDetailsKey = (groupId?: string) => ["groups", "details", groupId] as const;

export function useGroupDetails(groupId?: string) {
  return useQuery({
    queryKey: groupDetailsKey(groupId),
    queryFn: () => groupsApi.getDetails(groupId as string),
    enabled: Boolean(groupId),
    staleTime: 30_000,
  });
}
