import { profileClient as apiClient } from "@/api/client";

export type Profile = {
  uid: number;
  display_name: string;
  avatar_media_id: number | null;
  weekly_goal: number | null;
  xp: number;
  streak: number;
  timezone: string;
  created_at: string;
  updated_at: string;

  // اگر بعداً اضافه شد:
  followers?: number;
  following?: number;

  // اگر بک username/email هم می‌دهد:
  username?: string;
  email?: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
};

export type Preferences = {
  uid: number;
  is_subject_public: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ProfileMeResponse = {
  profile: Profile;
  preferences: Preferences | null;
};

export type UpdateProfilePayload = {
  display_name?: string | null;
  avatar_media_id?: number | null;
  weekly_goal?: number | null;
  timezone?: string;
};

export const profileApi = {
  me: () => apiClient.get<ProfileMeResponse>("/profile/me"),
  dashboard: () => apiClient.get<{ profile?: Profile; todayStudyMinutes: number }>("/profile/dashboard"),
  updateMe: (payload: UpdateProfilePayload) => apiClient.patch<void>("/profile/me", payload),
};
