// src/api/study.ts
import { studyClient as apiClient } from "@/api/client";
import type {
  StudySubject,
  StudySession,
  StudyDashboard,
  WeeklyGoalUpdateResponse,
} from "@/api/types";

const STUDY_PREFIX = "/study";

// ---------- Subjects ----------
export type CreateSubjectBody = {
  name: string;
  color?: string | null;
};

export type UpdateSubjectBody = Partial<CreateSubjectBody>;

// ---------- Sessions ----------
export type LogSessionBody = {
  subjectId: string;
  durationMins: number;
  startedAt?: string | null; // ISO date-time
};

export type ListSessionsParams = {
  from?: string | null; // ISO date-time
  to?: string | null;   // ISO date-time
  limit?: number;
  offset?: number;
};

// ---------- Dashboard ----------
export type StudyDashboardParams = {
  from?: string | null; // swagger گفته date ولی بک string می‌گیره
  to?: string | null;
};

function toQueryString(obj: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export type StudyPresenceActiveMeta =
  | null
  | {
      subjectId?: string | null;
      startedAt: string; // ISO date-time
      lastHbAt?: string;
      source?: string;
    };

export type StudyPresenceResponse = {
  day: string; // YYYY-MM-DD (UTC)
  active: Record<string, StudyPresenceActiveMeta>;
  todayMinsBase: Record<string, number>;
};


export const studyApi = {
  // ---------- Subjects ----------
  listSubjects: () =>
    apiClient.get<StudySubject[]>(`${STUDY_PREFIX}/subjects`),

  createSubject: (body: CreateSubjectBody) =>
    apiClient.post<StudySubject>(`${STUDY_PREFIX}/subjects`, body),

  updateSubject: (subjectId: string, fields: UpdateSubjectBody) =>
    apiClient.patch<StudySubject>(`${STUDY_PREFIX}/subjects/${subjectId}`, fields),

  deleteSubject: (subjectId: string) =>
    apiClient.delete<void>(`${STUDY_PREFIX}/subjects/${subjectId}`),

  // ---------- Sessions ----------
  logSession: (body: LogSessionBody) =>
    apiClient.post<StudySession>(`${STUDY_PREFIX}/sessions`, body),

  listSessions: (params?: ListSessionsParams) =>
    apiClient.get<StudySession[]>(
      `${STUDY_PREFIX}/sessions${toQueryString(params ?? {})}`
    ),

  // ---------- Dashboard / Weekly goal ----------
  getDashboard: (params?: StudyDashboardParams) =>
    apiClient.get<StudyDashboard>(
      `${STUDY_PREFIX}/dashboard${toQueryString(params ?? {})}`
    ),

  updateWeeklyGoal: (weeklyGoalMins: number) =>
    apiClient.patch<WeeklyGoalUpdateResponse>(
      `${STUDY_PREFIX}/stats/weekly-goal`,
      { weeklyGoalMins }
    ),
      // ---------- Presence ----------
  getPresence: (uids: Array<string | number>) => {
    const q = toQueryString({ uids: uids.map(String).join(",") });
    return apiClient.get<StudyPresenceResponse>(`${STUDY_PREFIX}/presence${q}`);
  },

};
