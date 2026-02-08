// src/hooks/useStudy.ts
import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studyApi } from "@/api/study";
import { profileMeKey } from "@/hooks/useProfileMe";
import type { StudyPresenceResponse } from "@/api/study";
import type {
  CreateSubjectBody,
  UpdateSubjectBody,
  ListSessionsParams,
  StudyDashboardParams,
  LogSessionBody,
} from "@/api/study";
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

function stableParamsKey(params: unknown) {
  if (!params) return "";
  try {
    const obj = params as Record<string, any>;
    const keys = Object.keys(obj).sort();
    const stable: Record<string, any> = {};
    for (const k of keys) stable[k] = obj[k];
    return JSON.stringify(stable);
  } catch {
    return String(params);
  }
}

export const studyKeys = {
  root: ["study"] as const,

  presence: (uids?: Array<string | number>) =>
    ["study", "presence", (uids ?? []).map(String).sort().join(",")] as const,

  subjects: () => ["study", "subjects"] as const,

  sessions: (params?: ListSessionsParams) => ["study", "sessions", stableParamsKey(params)] as const,

  dashboard: (params?: StudyDashboardParams) => ["study", "dashboard", stableParamsKey(params)] as const,
};

// ---------- Subjects ----------
export function useSubjects() {
  const q = useQuery({
    queryKey: studyKeys.subjects(),
    queryFn: () => studyApi.listSubjects(),
    retry: false,
    staleTime: 0,
  });

  useQueryErrorUi(q);
  return q;
}

export function useCreateSubject() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: CreateSubjectBody) => studyApi.createSubject(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });
      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
      });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (body: CreateSubjectBody) => mutation.mutate(record(body));
  return { ...mutation, mutate };
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (args: { subjectId: string; fields: UpdateSubjectBody }) =>
      studyApi.updateSubject(args.subjectId, args.fields),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });
      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
      });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (vars: { subjectId: string; fields: UpdateSubjectBody }) => mutation.mutate(record(vars));
  return { ...mutation, mutate };
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (subjectId: string) => studyApi.deleteSubject(subjectId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });

      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
      });

      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "sessions",
      });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (subjectId: string) => mutation.mutate(record(subjectId));
  return { ...mutation, mutate };
}

// ---------- Sessions ----------
export function useSessions(params?: ListSessionsParams) {
  const q = useQuery({
    queryKey: studyKeys.sessions(params),
    queryFn: () => studyApi.listSessions(params),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useQueryErrorUi(q);
  return q;
}

export function useLogSession() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: LogSessionBody) => studyApi.logSession(body),

    onSuccess: async () => {
      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "sessions",
      });

      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
      });

      await qc.invalidateQueries({ queryKey: profileMeKey });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (body: LogSessionBody) => mutation.mutate(record(body));
  return { ...mutation, mutate };
}

// ---------- Dashboard / Weekly goal ----------
export function useStudyDashboard(params?: StudyDashboardParams) {
  const q = useQuery({
    queryKey: studyKeys.dashboard(params),
    queryFn: () => studyApi.getDashboard(params),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useQueryErrorUi(q);
  return q;
}

export function useUpdateWeeklyGoal() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (weeklyGoalMins: number) => studyApi.updateWeeklyGoal(weeklyGoalMins),
    onSuccess: async () => {
      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
      });
    },
  });

  const record = useMutationErrorUi(mutation);
  const mutate = (mins: number) => mutation.mutate(record(mins));
  return { ...mutation, mutate };
}

export function useStudyPresence(uids: Array<string | number>, enabled = true) {
  const u = (uids ?? []).map(String).filter(Boolean);
  const ok = enabled && u.length > 0;

  const q = useQuery<StudyPresenceResponse>({
    queryKey: studyKeys.presence(u),
    queryFn: () => studyApi.getPresence(u),
    enabled: ok,
    retry: false,
    staleTime: 0,
    refetchInterval: ok ? 25000 : false,
    refetchOnWindowFocus: true,
  });

  useQueryErrorUi(q);
  return q;
}