import { apiClient } from "@/api/client";

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
};

export type Preferences = {
  uid: number;
  is_subject_public: boolean | null;
  created_at: string;
  updated_at: string;
};

export type ProfileMeResponse = {
  profile: Profile;
  preferences: Preferences;
};

export const profileApi = {
  me: () => apiClient.get<ProfileMeResponse>("/profile/me"),
};
