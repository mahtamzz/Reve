import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/api/groups";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

const joinRequestsKey = (groupId: string) => ["groups", "join-requests", groupId] as const;

type Vars = { groupId: string; userId: string | number };

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
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

export function useApproveJoinRequestAction() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ groupId, userId }: Vars) => {
      await groupsApi.approveJoinRequest(groupId, userId);
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups", "join-requests"] });
      await qc.invalidateQueries({ queryKey: ["groups", "members", vars.groupId] });
      await qc.invalidateQueries({ queryKey: ["groups", "membership", "me", vars.groupId] });
      await qc.invalidateQueries({ queryKey: ["groups", "me"] });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: Vars) => mutation.mutate(record(vars));

  return { ...mutation, mutate };
}

export function useRejectJoinRequestAction() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ groupId, userId }: Vars) => {
      await groupsApi.rejectJoinRequest(groupId, userId);
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: joinRequestsKey(vars.groupId) });
      await qc.invalidateQueries({ queryKey: ["groups", "join-requests"] });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: Vars) => mutation.mutate(record(vars));

  return { ...mutation, mutate };
}
