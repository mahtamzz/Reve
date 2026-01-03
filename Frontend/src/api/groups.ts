// src/api/groups.ts
import { groupsClient as apiClient } from "@/api/client";
import type {
  ApiGroup,
  ApiGroupDetailsResponse,
  GroupVisibility,
  ApiJoinRequest,
} from "@/api/types";

const GROUPS_PREFIX = "/groups";

export type CreateGroupBody = {
  name: string;
  description?: string | null;
  visibility: GroupVisibility;
  weeklyXp: number | null;
  minimumDstMins: number | null;
};

export type ApiMyMembership = {
  groupId: string;
  uid: string | number;
  isMember: boolean;
  role: "owner" | "admin" | "member" | null;
};

type JoinRequestsResponse = {
  groupId: string;
  total: number;
  items: ApiJoinRequest[];
};

async function tryGet<T>(paths: string[]): Promise<T> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      return await apiClient.get<T>(p);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export const groupsApi = {
  getDetails: (id: string) =>
    tryGet<ApiGroupDetailsResponse>([
      `${GROUPS_PREFIX}/${id}`,
      `${GROUPS_PREFIX}/${id}/details`,
    ]),

  create: (body: CreateGroupBody) => apiClient.post<ApiGroup>(GROUPS_PREFIX, body),

  remove: (groupId: string) => apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}`),

  update: (groupId: string, fields: Partial<CreateGroupBody>) =>
    apiClient.patch<ApiGroup>(`${GROUPS_PREFIX}/${groupId}`, fields),

  join: (groupId: string) =>
    apiClient.post<{ status: "joined" | "requested" }>(`${GROUPS_PREFIX}/${groupId}/join`),

  leave: (groupId: string) => apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/leave`),

  list: (params: { limit?: number; offset?: number } = {}) => {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    );
  },

  // ✅ FIX: این endpoint آبجکت میده، ما فقط items رو برمی‌گردونیم (آرایه)
  listJoinRequests: async (groupId: string): Promise<ApiJoinRequest[]> => {
    const res = await apiClient.get<JoinRequestsResponse>(`${GROUPS_PREFIX}/${groupId}/requests`);
    return Array.isArray(res?.items) ? res.items : [];
  },

  approveJoinRequest: (groupId: string, userId: string | number) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/requests/${userId}/approve`),

  rejectJoinRequest: (groupId: string, userId: string | number) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/requests/${userId}/reject`),

  search: (params: { q: string; limit?: number; offset?: number }) => {
    const q = params.q ?? "";
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(
        limit
      )}&offset=${encodeURIComponent(offset)}`
    );
  },

  getMyMembership: (groupId: string) =>
    apiClient.get<ApiMyMembership>(`${GROUPS_PREFIX}/${groupId}/members/me`),

  listMine: () => apiClient.get<ApiGroup[]>(`${GROUPS_PREFIX}/me`),
};
