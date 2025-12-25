import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";

export const groupByIdKey = (id: string) => ["groups", "byId", id] as const;

export function useGroupById(id: string) {
  return useQuery({
    queryKey: groupByIdKey(id),
    queryFn: () => groupsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    // اینجا فقط می‌تونی صفحه‌ی جزئیات گروه جدید رو باز کنی
    // یا اگر ids رو نگه می‌داری، اون لیست ids رو invalidate کنی
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
  });
}
