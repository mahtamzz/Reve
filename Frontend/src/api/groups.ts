// src/api/groups.ts
import { groupsClient as apiClient } from "@/api/client";
import type { ApiGroup, ApiGroupDetailsResponse, GroupVisibility } from "@/api/types";

const GROUPS_PREFIX = "/groups";

export type CreateGroupBody = {
  name: string;
  description?: string | null;
  visibility: GroupVisibility;
  weeklyXp: number | null;
  minimumDstMins: number | null;
};

export const groupsApi = {
  getDetails: (id: string) =>
    apiClient.get<ApiGroupDetailsResponse>(`${GROUPS_PREFIX}/${id}`),

  create: (body: CreateGroupBody) =>
    apiClient.post<ApiGroup>(GROUPS_PREFIX, body),

  remove: (groupId: string) =>
    apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}`),

  update: (groupId: string, fields: Partial<CreateGroupBody>) =>
    apiClient.patch<ApiGroup>(`${GROUPS_PREFIX}/${groupId}`, fields),

  join: (groupId: string) =>
    apiClient.post<{ status: "joined" | "requested" }>(`${GROUPS_PREFIX}/${groupId}/join`),

  leave: (groupId: string) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/leave`),

  list: (params: { limit?: number; offset?: number } = {}) => {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    );
  },

  search: (params: { q: string; limit?: number; offset?: number }) => {
    const q = params.q ?? "";
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    );
  },
};
