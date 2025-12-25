// src/hooks/useGroups.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";
import type { ApiGroupDetailsResponse } from "@/api/types";

export const groupDetailsKey = (id: string) => ["groups", "details", id] as const;

export function useGroupDetails(id: string) {
  return useQuery({
    queryKey: groupDetailsKey(id),
    queryFn: () => groupsApi.getDetails(id),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: (created) => {
      // ✅ چون details endpoint شکلش فرق داره، اینجا فقط invalidate می‌کنیم
      // و اگر لازم شد بعداً با getDetails پر می‌کنیم.
      qc.invalidateQueries({ queryKey: ["groups"] });

      // می‌تونی optionally دیتای group رو زیر یک key جدا ذخیره کنی،
      // ولی الان ما list نداریم و صفحه Groups بر اساس ids، details می‌گیرد.
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: (_void, groupId) => {
      qc.removeQueries({ queryKey: groupDetailsKey(groupId) });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
