// src/hooks/useGroups.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";
import type { ApiJoinRequest } from "@/api/types";


export const groupDetailsKey = (id: string) => ["groups", "details", id] as const;
export const myGroupsKey = () => ["groups", "me"] as const;
export const myMembershipKey = (groupId: string) => ["groups", "membership", groupId] as const;

export function useGroupDetails(id: string, enabled = true) {
  return useQuery({
    queryKey: groupDetailsKey(id),
    queryFn: () => groupsApi.getDetails(id),
    enabled: !!id && enabled,
    retry: false,
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: myGroupsKey(),
    queryFn: () => groupsApi.listMine(),
    retry: false,
  });
}

export function useMyMembership(groupId: string) {
  return useQuery({
    queryKey: myMembershipKey(groupId),
    queryFn: () => groupsApi.getMyMembership(groupId),
    enabled: !!groupId,
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

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: myGroupsKey() });
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
      qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.join(groupId),
    onSuccess: (_data, groupId) => {
      qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      qc.invalidateQueries({ queryKey: myGroupsKey() });
      qc.invalidateQueries({ queryKey: groupDetailsKey(groupId) });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;

export function useJoinRequests(groupId: string, enabled: boolean) {
  return useQuery({
    queryKey: joinRequestsKey(groupId),
    queryFn: () => groupsApi.listJoinRequests(groupId),
    enabled: !!groupId && enabled,
    retry: false,
  });
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: (_v, vars) => {
      qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
      qc.invalidateQueries({ queryKey: myGroupsKey() });
      qc.invalidateQueries({ queryKey: myMembershipKey(vars.groupId) });
    },
  });
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.rejectJoinRequest(groupId, userId),
    onSuccess: (_v, vars) => {
      qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
    },
  });
}
