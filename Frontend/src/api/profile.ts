import { profileClient as apiClient } from "@/api/client";

/** ---------- Types (shape from backend responses) ---------- */

export type Profile = {
  uid: number;

  display_name: string;
  avatar_media_id: string | number | null;
  weekly_goal: number | null;
  xp: number;
  streak: number;
  timezone: string;

  created_at: string;
  updated_at: string;

  followers?: number;
  following?: number;
  username?: string;
  email?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;

  [k: string]: any;
};

export type Preferences = {
  uid: number;

  // swagger: is_subject_public
  is_subject_public?: boolean | null;

  // but your CreateUserProfile sets: isProfilePublic, showStreak
  // so we tolerate those too:
  isProfilePublic?: boolean | null;
  showStreak?: boolean | null;

  created_at?: string;
  updated_at?: string;

  [k: string]: any;
};

export type ProfileMeResponse = {
  profile: Profile;
  preferences: Preferences | null;
};

export type DashboardResponse = {
  profile: Profile;
  todayStudyMinutes: number;
};

export type UpdateProfilePayload = {
  // swagger supports these (and backend supports both snake/camel for some)
  username?: string;
  display_name?: string | null;
  displayName?: string | null;

  avatar_media_id?: string | number | null;
  avatarMediaId?: string | number | null;

  weekly_goal?: number | null;
  weeklyGoal?: number | null;

  timezone?: string;
};

export type UpdatePreferencesPayload = {
  // swagger says only is_subject_public, but backend accepts arbitrary prefs object
  is_subject_public?: boolean | null;

  // tolerate repo-style keys too:
  isProfilePublic?: boolean | null;
  showStreak?: boolean | null;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type PublicProfilesBatchResponse = {
  items: Array<{
    uid: number;
    display_name?: string | null;
    timezone?: string | null;
    avatar_url?: string | null;
    [k: string]: any;
  }>;
};

/** ---------- Normalizers (for snake/camel tolerance) ---------- */

function normalizeProfile(raw: any): Profile {
  if (!raw || typeof raw !== "object") return raw as Profile;

  const display_name =
    raw.display_name ??
    raw.displayName ??
    raw.username ?? // sometimes you sync username -> display_name
    "";

  return {
    ...raw,
    uid: Number(raw.uid),
    display_name,
    avatar_media_id: raw.avatar_media_id ?? raw.avatarMediaId ?? raw.avatar_mediaId ?? null,
    weekly_goal: raw.weekly_goal ?? raw.weeklyGoal ?? null,
    timezone: raw.timezone ?? "UTC",
  } as Profile;
}

function normalizeMeResponse(raw: any): ProfileMeResponse {
  const profile = normalizeProfile(raw?.profile ?? raw?.data?.profile);
  const preferences = raw?.preferences ?? raw?.data?.preferences ?? null;
  return { profile, preferences };
}

function normalizeDashboard(raw: any): DashboardResponse {
  return {
    profile: normalizeProfile(raw?.profile ?? raw?.data?.profile),
    todayStudyMinutes: Number(raw?.todayStudyMinutes ?? raw?.data?.todayStudyMinutes ?? 0),
  };
}

/** ---------- API ---------- */

export const profileApi = {
  me: async (): Promise<ProfileMeResponse> => {
    const res = await apiClient.get<any>("/profile/me");
    return normalizeMeResponse(res);
  },

  dashboard: async (): Promise<DashboardResponse> => {
    const res = await apiClient.get<any>("/profile/dashboard");
    return normalizeDashboard(res);
  },

  updateMe: (payload: UpdateProfilePayload) => apiClient.patch<void>("/profile/me", payload),

  updatePreferences: (payload: UpdatePreferencesPayload) =>
    apiClient.patch<void>("/profile/preferences", payload),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.patch<void>("/profile/me/password", payload),

  getPublicProfilesBatch: async (uids: Array<number | string>) => {
    const cleaned = [...new Set(uids.map((x) => Number(x)).filter(Number.isFinite))];
    const res = await apiClient.post<PublicProfilesBatchResponse>("/profile/public/batch", {
      uids: cleaned,
    });
    return Array.isArray(res?.items) ? res.items : [];
  },
};
