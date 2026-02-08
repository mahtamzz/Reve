import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminGroupsApi } from "@/api/adminGroups";

export const adminGroupsKeys = {
  all: ["admin", "groups"] as const,
  list: (limit: number, offset: number) => ["admin", "groups", "list", limit, offset] as const,
};

export function useAdminGroupsList(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;

  return useQuery({
    queryKey: adminGroupsKeys.list(limit, offset),
    queryFn: () => adminGroupsApi.listAll({ limit, offset }),
    retry: false,
  });
}

export function useAdminDeleteGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => adminGroupsApi.deleteGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminGroupsKeys.all });
    },
  });
}
