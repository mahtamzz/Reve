import { groupsClient as apiClient } from "@/api/client";
import type { ApiGroup } from "@/api/types";

export type CreateGroupBody = {
  name: string;
  description?: string | null;
  weekly_xp?: number | null;
  minimum_dst_mins?: number | null;
};

export const groupsApi = {

  getById: (id: string) => apiClient.get<ApiGroup>(`/groups/${id}`),

  create: (body: CreateGroupBody) => apiClient.post<ApiGroup>("/groups", body),

  remove: (groupId: string) => apiClient.delete<{ ok: true }>(`/groups/${groupId}`),
};
