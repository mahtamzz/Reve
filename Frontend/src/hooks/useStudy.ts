// src/hooks/useStudy.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studyApi } from "@/api/study";
import { profileMeKey } from "@/hooks/useProfileMe";

import type {
  CreateSubjectBody,
  UpdateSubjectBody,
  ListSessionsParams,
  StudyDashboardParams,
  LogSessionBody,
} from "@/api/study";

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

// ---------- Query Keys ----------
export const studyKeys = {
  root: ["study"] as const,

  subjects: () => ["study", "subjects"] as const,

  sessions: (params?: ListSessionsParams) =>
    ["study", "sessions", stableParamsKey(params)] as const,

  dashboard: (params?: StudyDashboardParams) =>
    ["study", "dashboard", stableParamsKey(params)] as const,
};

// ---------- Subjects ----------
export function useSubjects() {
  return useQuery({
    queryKey: studyKeys.subjects(),
    queryFn: () => studyApi.listSubjects(),
    retry: false,
    staleTime: 0,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSubjectBody) => studyApi.createSubject(body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });

      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "dashboard",
      });
    },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: { subjectId: string; fields: UpdateSubjectBody }) =>
      studyApi.updateSubject(args.subjectId, args.fields),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });

      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "dashboard",
      });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (subjectId: string) => studyApi.deleteSubject(subjectId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: studyKeys.subjects() });

      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "dashboard",
      });

      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "sessions",
      });
    },
  });
}

// ---------- Sessions ----------
export function useSessions(params?: ListSessionsParams) {
  return useQuery({
    queryKey: studyKeys.sessions(params),
    queryFn: () => studyApi.listSessions(params),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useLogSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: LogSessionBody) => studyApi.logSession(body),

    onSuccess: async () => {
      // ✅ sessions (all params)
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "sessions",
      });

      // ✅ dashboard (all params)
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "dashboard",
      });

      // ✅ XP / streak live in profile => must refetch
      await qc.invalidateQueries({ queryKey: profileMeKey });
    },
  });
}

// ---------- Dashboard / Weekly goal ----------
export function useStudyDashboard(params?: StudyDashboardParams) {
  return useQuery({
    queryKey: studyKeys.dashboard(params),
    queryFn: () => studyApi.getDashboard(params),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateWeeklyGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (weeklyGoalMins: number) => studyApi.updateWeeklyGoal(weeklyGoalMins),
    onSuccess: async () => {
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "study" &&
          q.queryKey[1] === "dashboard",
      });
    },
  });
}
