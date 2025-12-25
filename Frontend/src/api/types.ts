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
