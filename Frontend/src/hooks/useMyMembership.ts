import { useQuery } from "@tanstack/react-query";
import { groupsApi } from "@/api/groups";

export const myMembershipKey = (groupId?: string) =>
  ["groups", "membership", "me", groupId] as const;

export function useMyMembership(groupId?: string) {
  return useQuery({
    queryKey: myMembershipKey(groupId),
    queryFn: () => groupsApi.getMyMembership(groupId as string),
    enabled: Boolean(groupId),
    staleTime: 30_000,
  });
}
