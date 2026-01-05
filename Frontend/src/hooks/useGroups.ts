// src/hooks/useGroups.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody } from "@/api/groups";
import type {
  ApiGroup,
  ApiGroupDetailsResponse,
  ApiListGroupMembersResponse,
} from "@/api/types";
import type { JoinRequestsResponse } from "@/api/groups";

// --------------------
// Query Keys
// --------------------
export const groupDetailsKey = (groupId: string) => ["groups", "details", groupId] as const;
export const myGroupsKey = () => ["groups", "me"] as const;
export const myMembershipKey = (groupId: string) => ["groups", "membership", "me", groupId] as const;

export const groupMembersKey = (groupId: string) =>
  ["groups", "members", groupId] as const;

export function useGroupMembers(groupId: string, enabled = true) {
  return useQuery<ApiListGroupMembersResponse>({
    queryKey: groupMembersKey(groupId),
    queryFn: () => groupsApi.listMembers(groupId),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 15_000,
  });
}

export const groupsDiscoverKey = (limit: number, offset: number) =>
  ["groups", "discover", { limit, offset }] as const;

export const groupsSearchKey = (q: string, limit: number, offset: number) =>
  ["groups", "search", { q, limit, offset }] as const;

export const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;

// --------------------
// Queries
// --------------------
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
  return useQuery<ApiGroup[]>({
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

export function useDiscoverGroups(limit: number, offset: number) {
  return useQuery<ApiGroup[]>({
    queryKey: groupsDiscoverKey(limit, offset),
    queryFn: () => groupsApi.list({ limit, offset }),
    retry: false,
    staleTime: 30_000,
  });
}

export function useSearchGroups(params: { q: string; limit?: number; offset?: number }, enabled = true) {
  const q = params.q ?? "";
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  return useQuery<ApiGroup[]>({
    queryKey: groupsSearchKey(q, limit, offset),
    queryFn: () => groupsApi.search({ q, limit, offset }),
    enabled: enabled && Boolean(q.trim()),
    retry: false,
    staleTime: 15_000,
  });
}


export function useJoinRequests(groupId: string, enabled = true) {
  return useQuery<JoinRequestsResponse>({
    queryKey: joinRequestsKey(groupId),
    queryFn: () => groupsApi.listJoinRequests(groupId),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 10_000,
  });
}

// --------------------
// Mutations
// --------------------
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

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, fields }: { groupId: string; fields: Partial<CreateGroupBody> }) =>
      groupsApi.update(groupId, fields),
    onSuccess: async (_updated, vars) => {
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
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
      await qc.removeQueries({ queryKey: groupMembersKey(groupId) });
      await qc.removeQueries({ queryKey: joinRequestsKey(groupId) });
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
      await qc.invalidateQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leave(groupId),
    onSuccess: async (_void, groupId) => {
      await qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.removeQueries({ queryKey: groupDetailsKey(groupId) });
      await qc.removeQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
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
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
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
    },
  });
}

export function useChangeMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { groupId: string; userId: string | number; role: "admin" | "member" }) =>
      groupsApi.changeMemberRole(vars.groupId, vars.userId, vars.role),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
    },
  });
}

export function useKickMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { groupId: string; userId: string | number }) =>
      groupsApi.kickMember(vars.groupId, vars.userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
    },
  });
}
