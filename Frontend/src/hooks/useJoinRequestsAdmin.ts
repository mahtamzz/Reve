// src/hooks/useJoinRequestsAdmin.ts
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, type JoinRequestsResponse } from "@/api/groups";
import { groupKey as groupDetailsKey, myGroupsKey, joinRequestsKey } from "@/hooks/useGroups";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

function useQueryErrorUi(q: { isError: boolean; error: unknown; refetch: () => any }) {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  useEffect(() => {
    if (!q.isError || !q.error) return;
    if (lastHandledRef.current === q.error) return;
    lastHandledRef.current = q.error;
    handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
  }, [q.isError, q.error, q.refetch, ui]);
}

function useMutationErrorUi<TVars>(m: { isError: boolean; error: unknown; mutate: (vars: TVars) => any }) {
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

export function useJoinRequestsAdmin(groupId?: string, enabled = true) {
  const q = useQuery<JoinRequestsResponse>({
    queryKey: joinRequestsKey(groupId as string),
    queryFn: () => groupsApi.listJoinRequests(groupId as string),
    enabled: Boolean(groupId) && enabled,
    retry: false,
    staleTime: 10_000,
  });

  useQueryErrorUi(q);
  return q;
}

export function useApproveJoinRequestAdmin() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.approveJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: myGroupsKey() });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number }) => mutation.mutate(record(vars));

  return { ...mutation, mutate };
}

export function useRejectJoinRequestAdmin() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string | number }) =>
      groupsApi.rejectJoinRequest(groupId, userId),
    onSuccess: async (_v, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: groupDetailsKey(vars.groupId) });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { groupId: string; userId: string | number }) => mutation.mutate(record(vars));

  return { ...mutation, mutate };
}
