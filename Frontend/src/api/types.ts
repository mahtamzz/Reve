// src/api/types.ts

export type GroupVisibility = "public" | "private";

export type ApiOk = { ok: boolean };

export type User = {
  uid: string;
  email: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  [k: string]: any;
};


export type ApiGroup = {
  id: string;
  name: string;
  description: string | null;
  visibility: GroupVisibility;
  weekly_xp: number | null;
  minimum_dst_mins: number | null;
  owner_uid: string | number;
  created_at: string;
  updated_at: string;
};

export type ApiGroupMember = Record<string, any> & {
  id?: string;
  uid?: string;
  userId?: string;

  name?: string;
  username?: string;
  displayName?: string;

  avatarUrl?: string;
  avatar_url?: string;

  online?: boolean;

  time?: string;
  studyTime?: string;
  study_time?: string;
};

export type ApiGroupDetailsResponse = {
  group: ApiGroup;
  members: ApiGroupMember[];
};


// ---------- Study Types ----------

export type StudySubject = {
  id: string;
  name: string;
  color: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StudySession = {
  id: string;
  subject_id?: string;
  subjectId?: string;
  duration_mins?: number;
  durationMins?: number;
  started_at?: string | null;
  startedAt?: string | null;
  [k: string]: any;
};

export type StudyDashboardTotalsRow = {
  uid: string;
  day: string; // "YYYY-MM-DD"
  total_duration_mins: number;
  [k: string]: any;
};

export type StudyStats = {
  uid?: string;
  weekly_goal_mins?: number;
  xp_total?: number;
  streak_current?: number;
  streak_best?: number;
  streak_last_day?: string | null;
  [k: string]: any;
};

export type StudyDashboard = {
  range?: { from: string; to: string };
  subjects?: StudySubject[];
  totals?: StudyDashboardTotalsRow[];
  stats?: StudyStats;
  [k: string]: any;
};


// ---------- Media Types ----------
export type ApiAvatarMeta = {
  id?: string;
  userId?: string;
  uid?: string;

  filename?: string;
  mimeType?: string;
  size?: number;

  url?: string;
  createdAt?: string;
  updatedAt?: string;

  mime_type?: string;
  created_at?: string;
  updated_at?: string;

  [k: string]: any;
};

export type ApiJoinRequest = {
  group_id: string;
  uid: string | number;
  created_at: string;
};
