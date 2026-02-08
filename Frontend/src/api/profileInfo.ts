// src/api/profileInfo.ts
import { profileClient as apiClient } from "@/api/client";

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

  username?: string;
  email?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;

  [k: string]: any;
};

export type Preferences = Record<string, any> & {
  uid: number;
  created_at?: string;
  updated_at?: string;
};

export type ProfileInfoMeResponse = {
  profile: Profile;
  preferences: Preferences | null;
};

export type ProfileInfoDashboardResponse = {
  profile: Profile;
  todayStudyMinutes: number;
};

export type UpdateProfileInfoPayload = {
  display_name?: string | null;
  weekly_goal?: number | null;
  timezone?: string;

  // tolerate camelCase too (backend supports some)
  displayName?: string | null;
  weeklyGoal?: number | null;
};

function normalizeProfile(raw: any): Profile {
  if (!raw || typeof raw !== "object") return raw as Profile;

  return {
    ...raw,
    uid: Number(raw.uid),
    display_name: raw.display_name ?? raw.displayName ?? "",
    avatar_media_id: raw.avatar_media_id ?? raw.avatarMediaId ?? null,
    weekly_goal: raw.weekly_goal ?? raw.weeklyGoal ?? null,
    xp: Number(raw.xp ?? 0),
    streak: Number(raw.streak ?? raw.streak_current ?? 0),
    timezone: raw.timezone ?? "UTC",
  } as Profile;
}

export const profileInfoApi = {
  getMe: async (): Promise<ProfileInfoMeResponse> => {
    const res = await apiClient.get<any>("/profile/me");
    return {
      profile: normalizeProfile(res?.profile),
      preferences: (res?.preferences ?? null) as Preferences | null,
    };
  },

  getDashboard: async (): Promise<ProfileInfoDashboardResponse> => {
    const res = await apiClient.get<any>("/profile/dashboard");
    return {
      profile: normalizeProfile(res?.profile),
      todayStudyMinutes: Number(res?.todayStudyMinutes ?? 0),
    };
  },

  updateProfileInfo: async (payload: UpdateProfileInfoPayload): Promise<void> => {
    await apiClient.patch<void>("/profile/me", payload);
  },
};
