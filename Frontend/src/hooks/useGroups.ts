// src/hooks/useGroups.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";

export const groupDetailsKey = (id: string) => ["groups", "details", id] as const;

export function useGroupDetails(id: string) {
  return useQuery({
    queryKey: groupDetailsKey(id),
    queryFn: () => groupsApi.getDetails(id),
    enabled: !!id,
    retry: false,
  });
}

export const groupsDiscoverKey = (limit: number, offset: number) =>
  ["groups", "discover", { limit, offset }] as const;

export function useDiscoverGroups(limit: number, offset: number) {
  return useQuery({
    queryKey: groupsDiscoverKey(limit, offset),
    queryFn: () => groupsApi.list({ limit, offset }),
    retry: false,
  });
}

export const groupsSearchKey = (q: string, limit: number, offset: number) =>
  ["groups", "search", { q, limit, offset }] as const;

export function useSearchGroups(q: string, limit: number, offset: number) {
  return useQuery({
    queryKey: groupsSearchKey(q, limit, offset),
    queryFn: () => groupsApi.search({ q, limit, offset }),
    enabled: q.trim().length > 0,
    retry: false,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
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
