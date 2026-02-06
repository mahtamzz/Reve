// src/hooks/useGroups.ts
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type CreateGroupBody, type UpdateGroupBody } from "@/api/groups";
import type { ApiGroupMember } from "@/api/types";
import { usePublicProfilesBatch } from "@/hooks/usePublicProfilesBatch";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

function useQueryErrorUi(q: {
  isError: boolean;
  error: unknown;
  refetch: () => any;
}) {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  useEffect(() => {
    if (!q.isError || !q.error) return;
    if (lastHandledRef.current === q.error) return;
    lastHandledRef.current = q.error;
    handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
  }, [q.isError, q.error, q.refetch, ui]);
}

function useMutationErrorUi<TVars>(
  m: {
    isError: boolean;
    error: unknown;
    mutate: (vars: TVars) => any;
  }
) {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);
  const lastVarsRef = useRef<TVars | null>(null);

  const recordVars = (vars: TVars) => {
    lastVarsRef.current = vars;
    return vars;
  };

  useEffect(() => {
    if (!m.isError || !m.error) return;
    if (lastHandledRef.current === m.error) return;
    lastHandledRef.current = m.error;

    handleUiError(asNormalized(m.error), ui, {
      retry: () => {
        const v = lastVarsRef.current;
        if (v != null) m.mutate(v);
      },
    });
  }, [m.isError, m.error, m.mutate, ui]);

  return recordVars;
}

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

function needsRemoteProfile(m: any) {
  const p = pickProfileFromMember(m);
  return !p.displayName && !p.username && !p.avatarUrl;
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
  const q = useQuery({
    queryKey: groupKey(gid),
    queryFn: () => groupsApi.getGroup(gid),
    enabled: Boolean(gid) && enabled,
    retry: false,
    staleTime: 30_000,
  });
  useQueryErrorUi(q);
  return q;
}

export function useMyGroups() {
  const q = useQuery({
    queryKey: myGroupsKey(),
    queryFn: () => groupsApi.listMine(),
    retry: false,
    staleTime: 30_000,
  });
  useQueryErrorUi(q);
  return q;
}

export function useDiscoverGroups(limit: number, offset: number) {
  const q = useQuery({
    queryKey: groupsDiscoverKey(limit, offset),
    queryFn: () => groupsApi.list({ limit, offset }),
    retry: false,
    staleTime: 30_000,
  });
  useQueryErrorUi(q);
  return q;
}

export function useMyMembership(groupId?: string, enabled = true) {
  const gid = groupId || "";
  const canCall = Boolean(gid) && isUuid(gid) && enabled;

  const q = useQuery({
    queryKey: myMembershipKey(gid),
    queryFn: () => groupsApi.getMyMembership(gid),
    enabled: canCall,
    retry: false,
    staleTime: 15_000,
  });
  useQueryErrorUi(q);
  return q;
}

/**
 * Members + profile merge via POST /profile/public/batch
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

  useQueryErrorUi(membersQ);

  const rawItems: ApiGroupMember[] = (membersQ.data as any)?.items ?? [];

  const needProfileUids = useMemo(() => {
    const need: string[] = [];
    for (const m of rawItems) {
      const uid = pickUid(m);
      if (!uid) continue;
      if (needsRemoteProfile(m)) need.push(uid);
    }
    return Array.from(new Set(need));
  }, [rawItems]);

  const batch = usePublicProfilesBatch(needProfileUids, Boolean(gid) && enabled);

  useQueryErrorUi({
    isError: Boolean((batch as any).isError),
    error: (batch as any).error,
    refetch: (batch as any).refetch ?? (() => {}),
  });

  const merged = useMemo(() => {
    const items = rawItems.map((m: any, idx: number) => {
      const uid = pickUid(m) ?? String(idx);
      const base = pickProfileFromMember(m);
      const p = batch.map.get(String(uid));

      const fallbackDisplayName =
        (typeof p?.display_name === "string" && p.display_name.trim() ? p.display_name.trim() : null) ||
        (typeof p?.username === "string" && p.username.trim() ? `@${p.username.replace(/^@/, "")}` : null) ||
        null;

      const displayName = base.displayName ?? fallbackDisplayName;
      const username =
        base.username ?? (typeof p?.username === "string" && p.username.trim() ? p.username.trim() : null);
      const avatarUrl =
        base.avatarUrl ?? (typeof p?.avatar_url === "string" && p.avatar_url.trim() ? p.avatar_url.trim() : null);

      return {
        ...m,
        uid,
        profile: {
          ...(m.profile || {}),
          display_name: displayName,
          username,
          avatar_url: avatarUrl,
          timezone: m?.profile?.timezone ?? (p as any)?.timezone ?? null,
        },
      };
    });

    const total = (membersQ.data as any)?.total ?? items.length;
    return { items, total };
  }, [rawItems, membersQ.data, batch.map]);

  const isLoading = membersQ.isLoading || (batch as any).isLoading;
  const isError = membersQ.isError || (batch as any).isError;

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
  const mutation = useMutation({
    mutationFn: (body: CreateGroupBody) => groupsApi.create(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["groups"] });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (body: CreateGroupBody) => mutation.mutate(record(body));
  return { ...mutation, mutate };
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ groupId, body }: { groupId: string; body: UpdateGroupBody }) =>
      groupsApi.update(groupId, body),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; body: UpdateGroupBody }) => mutation.mutate(record(vars));
  return { ...mutation, mutate };
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: async (_void, groupId) => {
      await qc.removeQueries({ queryKey: groupKey(groupId) });
      await qc.removeQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (groupId: string) => mutation.mutate(record(groupId));
  return { ...mutation, mutate };
}

export function useJoinGroup() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.join(groupId),
    onSuccess: async (_data, groupId) => {
      await qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.invalidateQueries({ queryKey: groupKey(groupId) });
      await qc.invalidateQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (groupId: string) => mutation.mutate(record(groupId));
  return { ...mutation, mutate };
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.leave(groupId),
    onSuccess: async (_v, groupId) => {
      await qc.invalidateQueries({ queryKey: myMembershipKey(groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
      await qc.invalidateQueries({ queryKey: groupMembersKey(groupId) });
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (groupId: string) => mutation.mutate(record(groupId));
  return { ...mutation, mutate };
}

// ---- join requests ----
export function useJoinRequests(groupId?: string, enabled = true) {
  const gid = groupId || "";
  const q = useQuery({
    queryKey: joinRequestsKey(gid),
    queryFn: () => groupsApi.listJoinRequests(gid),
    enabled: Boolean(gid) && enabled,
    retry: false,
    staleTime: 10_000,
  });
  useQueryErrorUi(q);
  return q;
}

export function useApproveJoinRequest() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myMembershipKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number }) => mutation.mutate(record(vars));
  return { ...mutation, mutate };
}

export function useRejectJoinRequest() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.rejectJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number }) => mutation.mutate(record(vars));
  return { ...mutation, mutate };
}

// ---- member management ----
export function useKickMember() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.kickMember(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupKey(vars.groupId) });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number }) => mutation.mutate(record(vars));
  return { ...mutation, mutate };
}

export function useChangeMemberRole() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      groupId,
      userId,
      role,
    }: {
      groupId: string;
      userId: string | number;
      role: "admin" | "member";
    }) => groupsApi.changeMemberRole(groupId, userId, role),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: groupMembersKey(vars.groupId) });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number; role: "admin" | "member" }) =>
    mutation.mutate(record(vars));
  return { ...mutation, mutate };
}
