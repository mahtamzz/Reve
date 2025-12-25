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

// پاسخ create در بک: خود group (همون چیزی که createGroup.execute برمی‌گردونه)
export const groupsApi = {
  // ✅ بک: GET /api/groups/:groupId -> { group, members }
  getDetails: (id: string) =>
    apiClient.get<ApiGroupDetailsResponse>(`${GROUPS_PREFIX}/${id}`),

  // ✅ بک: POST /api/groups -> group
  create: (body: CreateGroupBody) =>
    apiClient.post<ApiGroup>(GROUPS_PREFIX, body),

  // ✅ بک: DELETE /api/groups/:groupId -> 204
  remove: (groupId: string) =>
    apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}`),

  // اگر بعداً لازم شد:
  update: (groupId: string, fields: Partial<CreateGroupBody>) =>
    apiClient.patch<ApiGroup>(`${GROUPS_PREFIX}/${groupId}`, fields),

  join: (groupId: string) =>
    apiClient.post<{ status: "joined" | "requested" }>(`${GROUPS_PREFIX}/${groupId}/join`),

  leave: (groupId: string) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/leave`),
};
