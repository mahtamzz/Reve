import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";

export const groupsQueryKey = ["groups", "list"] as const;

export function useGroups() {
  return useQuery({
    queryKey: groupsQueryKey,
    queryFn: groupsApi.list,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKey });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupsQueryKey });
    },
  });
}
