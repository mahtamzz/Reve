import { apiClient } from "@/api/client";
import type { Group } from "@/api/types";

export type CreateGroupBody = { name: string };

export const groupsApi = {
  list: () => apiClient.get<Group[]>("/groups"),
  create: (body: CreateGroupBody) => apiClient.post<Group>("/groups", body),
  remove: (groupId: string) => apiClient.delete<{ ok: true }>(`/groups/${groupId}`),
};
