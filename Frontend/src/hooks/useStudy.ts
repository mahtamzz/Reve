// src/hooks/useStudy.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studyApi } from "@/api/study";
import type {
  CreateSubjectBody,
  UpdateSubjectBody,
} from "@/api/study";
import type { ListSessionsParams, StudyDashboardParams, LogSessionBody } from "@/api/study";

// ---------- Query Keys ----------
export const studyKeys = {
  root: ["study"] as const,

  subjects: () => ["study", "subjects"] as const,

  sessions: (params?: ListSessionsParams) =>
    ["study", "sessions", params ?? {}] as const,

  dashboard: (params?: StudyDashboardParams) =>
    ["study", "dashboard", params ?? {}] as const,
};

// ---------- Subjects ----------
export function useSubjects() {
  return useQuery({
    queryKey: studyKeys.subjects(),
    queryFn: () => studyApi.listSubjects(),
    retry: false,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSubjectBody) => studyApi.createSubject(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studyKeys.subjects() });
      // داشبورد ممکنه subjects list رو هم نشون بده
      qc.invalidateQueries({ queryKey: ["study", "dashboard"] });
    },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: { subjectId: string; fields: UpdateSubjectBody }) =>
      studyApi.updateSubject(args.subjectId, args.fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studyKeys.subjects() });
      qc.invalidateQueries({ queryKey: ["study", "dashboard"] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (subjectId: string) => studyApi.deleteSubject(subjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studyKeys.subjects() });
      qc.invalidateQueries({ queryKey: ["study", "dashboard"] });
      // اگر subject حذف شد، session list ها هم ممکنه تغییر معنی‌دار داشته باشند
      qc.invalidateQueries({ queryKey: ["study", "sessions"] });
    },
  });
}

// ---------- Sessions ----------
export function useSessions(params?: ListSessionsParams) {
  return useQuery({
    queryKey: studyKeys.sessions(params),
    queryFn: () => studyApi.listSessions(params),
    retry: false,
  });
}

export function useLogSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: LogSessionBody) => studyApi.logSession(body),
    onSuccess: () => {
      // همه لیست‌های sessions را (با هر پارامتر) invalidate کن
      qc.invalidateQueries({ queryKey: ["study", "sessions"] });
      qc.invalidateQueries({ queryKey: ["study", "dashboard"] });
    },
  });
}

// ---------- Dashboard / Weekly goal ----------
export function useStudyDashboard(params?: StudyDashboardParams) {
  return useQuery({
    queryKey: studyKeys.dashboard(params),
    queryFn: () => studyApi.getDashboard(params),
    retry: false,
  });
}

export function useUpdateWeeklyGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (weeklyGoalMins: number) => studyApi.updateWeeklyGoal(weeklyGoalMins),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study", "dashboard"] });
    },
  });
}
