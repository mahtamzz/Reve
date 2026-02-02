import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/api/groups";

const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;

type Vars = { groupId: string; userId: string | number };

export function useApproveJoinRequestAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: Vars) => {
      await groupsApi.approveJoinRequest(groupId, userId);
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups", "join-requests"] });
      await qc.invalidateQueries({ queryKey: ["groups", "members", vars.groupId] });
      await qc.invalidateQueries({ queryKey: ["groups", "membership", "me", vars.groupId] });
      await qc.invalidateQueries({ queryKey: ["groups", "me"] });
    },
  });
}

export function useRejectJoinRequestAction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, userId }: Vars) => {
      await groupsApi.rejectJoinRequest(groupId, userId);
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups", "join-requests"] });
    },
  });
}
