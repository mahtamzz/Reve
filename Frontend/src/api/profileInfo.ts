// src/api/profileInfo.ts
import { profileClient } from "@/api/client";

const PROFILE_INFO_PREFIX =
  (import.meta.env.VITE_PROFILE_INFO_PREFIX as string | undefined) ?? "/profile";

function withPrefix(path: string) {
  if (!PROFILE_INFO_PREFIX) return path;
  const p = PROFILE_INFO_PREFIX.startsWith("/")
    ? PROFILE_INFO_PREFIX
    : `/${PROFILE_INFO_PREFIX}`;
  return `${p}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ===================== TYPES ===================== */

export type ProfileInfo = {
  uid: string;
  display_name: string | null;
  timezone: string;

  avatar_media_id?: string | null;
  weekly_goal?: number | null;

  xp?: number;
  streak?: number;

  created_at?: string;
  updated_at?: string;

  [k: string]: any;
};

export type ProfileInfoPreferences = {
  // مطابق use-case بک
  isProfilePublic?: boolean;
  showStreak?: boolean;

  // اگر snake_case هم داری
  is_subject_public?: boolean | null;

  created_at?: string;
  updated_at?: string;

  [k: string]: any;
};

export type ProfileInfoMeResponse = {
  profile: ProfileInfo;
  preferences: ProfileInfoPreferences | null;
};

export type ProfileInfoDashboardResponse = {
  profile: ProfileInfo;
  todayStudyMinutes: number;
};

export type UpdateProfileInfoPayload = {
  // مهم: snake_case
  display_name?: string;
  avatar_media_id?: string | null;
  weekly_goal?: number | null;
  timezone?: string;
};

export type UpdateProfileInfoPreferencesPayload =
  Partial<ProfileInfoPreferences>;

/* ===================== API ===================== */

export const profileInfoApi = {
  getMe: () =>
    profileClient.get<ProfileInfoMeResponse>(withPrefix("/me")),

  getDashboard: () =>
    profileClient.get<ProfileInfoDashboardResponse>(
      withPrefix("/dashboard")
    ),

  updateProfileInfo: (payload: UpdateProfileInfoPayload) =>
    profileClient.patch<void>(withPrefix("/me"), payload),

  updatePreferences: (payload: UpdateProfileInfoPreferencesPayload) =>
    profileClient.patch<void>(withPrefix("/preferences"), payload),
};
