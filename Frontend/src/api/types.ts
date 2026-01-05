// src/api/types.ts

export type GroupVisibility = "public" | "private" | "invite_only";

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
  description?: string | null;
  visibility: GroupVisibility;
  weekly_xp?: number | null;
  minimum_dst_mins?: number | null;
  owner_uid?: number | string | null;
  created_at?: string;
  updated_at?: string;

  // sometimes backend returns camelCase
  weeklyXp?: number | null;
  minimumDstMins?: number | null;
};
export type ApiGroupMemberProfile = {
  display_name?: string | null;
  timezone?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
};


export type ApiGroupMember = {
  uid: number | string;
  role: "owner" | "admin" | "member";
  joined_at?: string;
  profile?: ApiGroupMemberProfile | null;

  // tolerant fields:
  userId?: number | string;
  id?: number | string;
  username?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  online?: boolean;
  time?: string;
  studyTime?: string;
  study_time?: string;
};

export type ApiGroupDetailsResponse = {
  group: ApiGroup;
  members: ApiGroupMember[];
};
export type ApiListGroupMembersResponse = {
  groupId: string;
  total: number;
  items: ApiGroupMember[];
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
