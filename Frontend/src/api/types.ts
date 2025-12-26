// src/api/types.ts

export type GroupVisibility = "public" | "private";

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

export type StudyDashboard = {
  subjects?: StudySubject[];
  totals?: {
    totalMins?: number;
    totalXp?: number;
    sessionsCount?: number;
    [k: string]: any;
  };
  stats?: {
    weeklyGoalMins?: number;
    streakDays?: number;
    [k: string]: any;
  };

  [k: string]: any;
};

export type WeeklyGoalUpdateResponse = {
  weeklyGoalMins?: number;
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
