// src/hooks/useJoinRequestsAdmin.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type JoinRequestsResponse } from "@/api/groups";
import { groupDetailsKey, myGroupsKey, joinRequestsKey } from "@/hooks/useGroups";

export function useJoinRequestsAdmin(groupId?: string, enabled = true) {
  return useQuery<JoinRequestsResponse>({
    queryKey: joinRequestsKey(groupId as string),
    queryFn: () => groupsApi.listJoinRequests(groupId as string),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 10_000,
  });
}

export function useApproveJoinRequestAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });
}

export function useRejectJoinRequestAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.rejectJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
    },
  });
}
