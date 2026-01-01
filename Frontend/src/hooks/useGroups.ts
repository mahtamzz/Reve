// src/hooks/useGroups.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";
import type { ApiJoinRequest, ApiGroupDetailsResponse } from "@/api/types";

export const groupDetailsKey = (groupId: string) => ["groups", "details", groupId] as const;
export const myGroupsKey = () => ["groups", "me"] as const;
export const myMembershipKey = (groupId: string) => ["groups", "membership", "me", groupId] as const;
export const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;

export function useGroupDetails(groupId: string, enabled = true) {
  return useQuery<ApiGroupDetailsResponse>({
    queryKey: groupDetailsKey(groupId),
    queryFn: () => groupsApi.getDetails(groupId),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: myGroupsKey(),
    queryFn: () => groupsApi.listMine(),
    retry: false,
    staleTime: 30_000,
  });
}

export function useMyMembership(groupId: string, enabled = true) {
  return useQuery({
    queryKey: myMembershipKey(groupId),
    queryFn: () => groupsApi.getMyMembership(groupId),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export const groupsDiscoverKey = (limit: number, offset: number) =>
  ["groups", "discover", { limit, offset }] as const;

export function useDiscoverGroups(limit: number, offset: number) {
  return useQuery({
    queryKey: groupsDiscoverKey(limit, offset),
    queryFn: () => groupsApi.list({ limit, offset }),
    retry: false,
    staleTime: 30_000,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["groups"] });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: async (_void, groupId) => {
      await qc.removeQueries({ queryKey: groupDetailsKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.join(groupId),
    onSuccess: async (_data, groupId) => {
      await qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinRequests(groupId: string, enabled: boolean) {
  return useQuery<ApiJoinRequest[]>({
    queryKey: joinRequestsKey(groupId),
    queryFn: () => groupsApi.listJoinRequests(groupId),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 10_000,
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.invalidateQueries({ queryKey: myMembershipKey(vars.groupId) });
    },
  });
}

export function useRejectJoinRequest() {
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
