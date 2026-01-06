// src/api/profileSocial.ts
import { profileClient } from "@/api/client";

const P = "/profile";

export type PublicProfileLite = {
  uid: number;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  [k: string]: any;
};

export type Paging = { limit: number; offset: number };

export type ListResponse<T> = {
  items: T[];
  paging: Paging;
};

export type FollowStatusResponse = { isFollowing: boolean };

export type FollowCountsResponse = {
  uid: number;
  followers: number;
  following: number;
};

export type FollowActionResponse =
  | { status: "followed" }
  | { status: "skipped"; reason: "already_following" }
  | { status: "unfollowed" }
  | { status: "skipped"; reason: "not_following" };

export const profileSocialApi = {
  /** GET /api/profile/:uid/followers */
  followers: (uid: number, params?: { limit?: number; offset?: number; includeProfiles?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    if (params?.includeProfiles != null) q.set("includeProfiles", String(params.includeProfiles));
    const qs = q.toString();
    return profileClient.get<ListResponse<PublicProfileLite>>(
      `${P}/${uid}/followers${qs ? `?${qs}` : ""}`
    );
  },

  /** GET /api/profile/:uid/following */
  following: (uid: number, params?: { limit?: number; offset?: number; includeProfiles?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    if (params?.includeProfiles != null) q.set("includeProfiles", String(params.includeProfiles));
    const qs = q.toString();
    return profileClient.get<ListResponse<PublicProfileLite>>(
      `${P}/${uid}/following${qs ? `?${qs}` : ""}`
    );
  },
    /** GET /api/profile/search?q=... */
    searchUsers: (params: { q: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      q.set("q", params.q);
      if (params.limit != null) q.set("limit", String(params.limit));
      if (params.offset != null) q.set("offset", String(params.offset));
  
      return profileClient.get<ListResponse<PublicProfileLite>>(
        `${P}/search?${q.toString()}`
      );
    },
  

  /** GET /api/profile/:uid/follow-status  (current user => target uid) */
  followStatus: (uid: number) =>
    profileClient.get<FollowStatusResponse>(`${P}/${uid}/follow-status`),

  /** GET /api/profile/:uid/follow-counts */
  followCounts: (uid: number) =>
    profileClient.get<FollowCountsResponse>(`${P}/${uid}/follow-counts`),

  /** POST /api/profile/:uid/follow */
  follow: (uid: number) =>
    profileClient.post<FollowActionResponse>(`${P}/${uid}/follow`),

  /** DELETE /api/profile/:uid/follow */
  unfollow: (uid: number) =>
    profileClient.delete<FollowActionResponse>(`${P}/${uid}/follow`),
};
