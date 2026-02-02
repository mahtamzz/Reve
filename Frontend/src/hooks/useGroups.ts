// src/hooks/useGroups.ts
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody, type UpdateGroupBody } from "@/api/groups";
import { profileClient } from "@/api/client";

// ---------- helpers ----------
export function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function pickUid(m: any): string | null {
  const uid = m?.uid ?? m?.user_id ?? m?.userId ?? m?.id ?? m?.profile?.uid ?? null;
  if (uid == null) return null;
  const s = String(uid);
  return s.trim() ? s : null;
}

function pickProfileFromMember(m: any) {
  const displayName =
    m?.profile?.display_name ??
    m?.profile?.displayName ??
    m?.profile?.name ??
    m?.user?.display_name ??
    m?.user?.displayName ??
    m?.display_name ??
    m?.displayName ??
    m?.name ??
    null;

  const username =
    m?.profile?.username ??
    m?.user?.username ??
    m?.username ??
    m?.handle ??
    null;

  const avatarUrl =
    m?.profile?.avatar_url ??
    m?.profile?.avatarUrl ??
    m?.user?.avatar_url ??
    m?.user?.avatarUrl ??
    m?.avatar_url ??
    m?.avatarUrl ??
    null;

  return {
    displayName: typeof displayName === "string" && displayName.trim() ? displayName.trim() : null,
    username: typeof username === "string" && username.trim() ? username.trim() : null,
    avatarUrl: typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null,
  };
}

async function fetchUserByUid(uid: string) {
  return profileClient.get<any>(`/users/${uid}`);
}

// ---------- query keys ----------
export const groupKey = (groupId: string) => ["groups", "group", groupId] as const;
export const groupMembersKey = (groupId: string) => ["groups", "members", groupId] as const;
export const myMembershipKey = (groupId: string) => ["groups", "membership", "me", groupId] as const;
export const myGroupsKey = () => ["groups", "me"] as const;
export const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;
export const groupsDiscoverKey = (limit: number, offset: number) =>
  ["groups", "discover", { limit, offset }] as const;

// ---------- queries ----------
export function useGroupDetails(groupId?: string, enabled = true) {
  const gid = groupId || "";
  return useQuery({
    queryKey: groupKey(gid),
    queryFn: () => groupsApi.getGroup(gid),
    enabled: Boolean(gid) && enabled,
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

export function useDiscoverGroups(limit: number, offset: number) {
  return useQuery({
    queryKey: groupsDiscoverKey(limit, offset),
    queryFn: () => groupsApi.list({ limit, offset }),
    retry: false,
    staleTime: 30_000,
  });
}

export function useMyMembership(groupId?: string, enabled = true) {
  const gid = groupId || "";
  const canCall = Boolean(gid) && isUuid(gid) && enabled;

  return useQuery({
    queryKey: myMembershipKey(gid),
    queryFn: () => groupsApi.getMyMembership(gid),
    enabled: canCall,
    retry: false,
    staleTime: 15_000,
  });
}

/**
 * Members with optional profile merge
 */
export function useGroupMembers(groupId?: string, enabled = true) {
  const gid = groupId || "";

  const membersQ = useQuery({
    queryKey: groupMembersKey(gid),
    queryFn: () => groupsApi.listMembers(gid),
    enabled: Boolean(gid) && enabled,
    retry: false,
    staleTime: 10_000,
  });

  const rawItems = (membersQ.data as any)?.items ?? [];

  const needProfileUids = useMemo(() => {
    const need: string[] = [];
    for (const m of rawItems) {
      const uid = pickUid(m);
      if (!uid) continue;
      const p = pickProfileFromMember(m);
      if (!p.displayName && !p.username && !p.avatarUrl) need.push(uid);
    }
    return Array.from(new Set(need));
  }, [rawItems]);

  const profileQueries = useQueries({
    queries: needProfileUids.map((uid) => ({
      queryKey: ["profile", "user", uid] as const,
      queryFn: () => fetchUserByUid(uid),
      enabled: Boolean(uid),
      retry: false,
      staleTime: 60_000,
    })),
  });

  const profileMap = useMemo(() => {
    const map = new Map<string, { displayName: string | null; username: string | null; avatarUrl: string | null }>();
    for (let i = 0; i < needProfileUids.length; i++) {
      const uid = needProfileUids[i];
      const data = profileQueries[i]?.data;
      if (!data) continue;

      const displayName =
        data?.display_name ??
        data?.displayName ??
        data?.name ??
        data?.username ??
        data?.email ??
        null;

      const username = data?.username ?? data?.handle ?? null;
      const avatarUrl = data?.avatar_url ?? data?.avatarUrl ?? null;

      map.set(uid, {
        displayName: typeof displayName === "string" && displayName.trim() ? displayName.trim() : null,
        username: typeof username === "string" && username.trim() ? username.trim() : null,
        avatarUrl: typeof avatarUrl === "string" && avatarUrl.trim() ? avatarUrl.trim() : null,
      });
    }
    return map;
  }, [needProfileUids, profileQueries]);

  const merged = useMemo(() => {
    const items = rawItems.map((m: any, idx: number) => {
      const uid = pickUid(m) ?? String(idx);
      const base = pickProfileFromMember(m);
      const fallback = profileMap.get(uid);

      const displayName = base.displayName ?? fallback?.displayName ?? null;
      const username = base.username ?? fallback?.username ?? null;
      const avatarUrl = base.avatarUrl ?? fallback?.avatarUrl ?? null;

      return {
        ...m,
        uid,
        profile: {
          display_name: displayName,
          username,
          avatar_url: avatarUrl,
        },
      };
    });

    const total = (membersQ.data as any)?.total ?? items.length;
    return { items, total };
  }, [rawItems, profileMap, membersQ.data]);

  const isLoading = membersQ.isLoading || profileQueries.some((q) => q.isLoading);
  const isError = membersQ.isError;

  return {
    ...membersQ,
    data: merged,
    isLoading,
    isError,
  };
}

// ---------- mutations ----------
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
    mutationFn: ({ groupId, body }: { groupId: string; body: UpdateGroupBody }) =>
      groupsApi.update(groupId, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: async (_void, groupId) => {
      await qc.removeQueries({ queryKey: groupKey(groupId) });
      await qc.removeQueries({ queryKey: groupMembersKey(groupId) });
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
      await qc.invalidateQueries({ queryKey: groupKey(groupId) });
      await qc.invalidateQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leave(groupId),
    onSuccess: async (_v, groupId) => {
      await qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.invalidateQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

// ---- join requests ----
export function useJoinRequests(groupId?: string, enabled = true) {
  const gid = groupId || "";
  return useQuery({
    queryKey: joinRequestsKey(gid),
    queryFn: () => groupsApi.listJoinRequests(gid),
    enabled: Boolean(gid) && enabled,
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
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myMembershipKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
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

// ---- member management ----
export function useKickMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.kickMember(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
    },
  });
}

export function useChangeMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string | number; role: "admin" | "member" }) =>
      groupsApi.changeMemberRole(groupId, userId, role),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
    },
  });
}
