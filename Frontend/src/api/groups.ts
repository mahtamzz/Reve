// src/api/groups.ts
import { groupsClient as apiClient } from "@/api/client";
import type {
  ApiGroup,
  ApiGroupDetailsResponse,
  ApiListGroupMembersResponse,
  ApiGroupMember,
  GroupVisibility,
} from "@/api/types";

const GROUPS_PREFIX = "/groups";

export type CreateGroupBody = {
  name: string;
  description?: string | null;
  visibility: GroupVisibility;
  weeklyXp?: number | null;
  minimumDstMins?: number | null;
};

export type UpdateGroupBody = Partial<CreateGroupBody>;

export type ApiMyMembership = {
  groupId: string;
  uid: string | number;
  isMember: boolean;
  role: "owner" | "admin" | "member" | null;
};

export type JoinRequestItem = {
  id: string;
  group_id: string;
  uid: number;
  created_at: string;
  [k: string]: any;
};

export type JoinRequestsResponse = {
  groupId: string;
  total: number;
  items: JoinRequestItem[];
};

function mapGroup(g: any): ApiGroup {
  if (!g) return g;
  return {
    ...g,
    weekly_xp: g.weekly_xp ?? g.weeklyXp ?? null,
    minimum_dst_mins: g.minimum_dst_mins ?? g.minimumDstMins ?? null,
  };
}

function normalizeMembersPayload(raw: any): ApiGroupMember[] {
  // backend: {items: [...]}
  if (raw && Array.isArray(raw.items)) return raw.items as ApiGroupMember[];
  // maybe backend returns array
  if (Array.isArray(raw)) return raw as ApiGroupMember[];
  // already in shape
  if (raw && Array.isArray(raw.members)) return raw.members as ApiGroupMember[];
  return [];
}

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
  // ---- core details ----
  getGroup: (id: string) =>
    tryGet<any>([
      `${GROUPS_PREFIX}/${id}`,
      `${GROUPS_PREFIX}/${id}/details`,
    ]).then((x) => {
      // بعضی بک‌اندها مستقیم group رو میدن، بعضی {group,...}
      const g = x?.group ?? x;
      return mapGroup(g);
    }),

    listMembers: async (groupId: string): Promise<ApiListGroupMembersResponse> => {
      const res = await apiClient.get<ApiListGroupMembersResponse>(
        `${GROUPS_PREFIX}/${groupId}/members`
      );
    
      const items = normalizeMembersPayload(res);
      return {
        ...res,
        total: (res as any)?.total ?? items.length,
        items,
      } as ApiListGroupMembersResponse;
    },

  getDetails: async (id: string): Promise<ApiGroupDetailsResponse> => {
    const group = await groupsApi.getGroup(id);

    let members: ApiGroupMember[] = [];
    try {
      const memRes = await apiClient.get<ApiListGroupMembersResponse>(
        `${GROUPS_PREFIX}/${id}/members`
      );
      members = normalizeMembersPayload(memRes);
      // اگر payload استاندارد بود:
      if (Array.isArray((memRes as any).items)) members = (memRes as any).items;
    } catch {
      members = [];
    }

    return { group, members };
  },

  // ---- create/update/delete ----
  create: (body: CreateGroupBody) =>
    apiClient.post<ApiGroup>(GROUPS_PREFIX, {
      name: body.name,
      description: body.description ?? null,
      visibility: body.visibility,
      weeklyXp: body.weeklyXp ?? undefined,
      minimumDstMins: body.minimumDstMins ?? undefined,
      // بک‌اند UpdateGroup خودش weeklyXp/minimumDstMins رو map میکنه
      // و CreateGroup هم weeklyXp/minimumDstMins رو می‌گیره.
    }).then(mapGroup),

  update: (groupId: string, fields: UpdateGroupBody) =>
    apiClient.patch<ApiGroup>(`${GROUPS_PREFIX}/${groupId}`, {
      ...(fields.name !== undefined ? { name: fields.name } : {}),
      ...(fields.description !== undefined ? { description: fields.description } : {}),
      ...(fields.visibility !== undefined ? { visibility: fields.visibility } : {}),
      ...(fields.weeklyXp !== undefined ? { weeklyXp: fields.weeklyXp } : {}),
      ...(fields.minimumDstMins !== undefined ? { minimumDstMins: fields.minimumDstMins } : {}),
    }).then(mapGroup),

  remove: (groupId: string) => apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}`),

  // ---- membership ----
  join: (groupId: string) =>
    apiClient.post<{ status: "joined" | "requested" }>(`${GROUPS_PREFIX}/${groupId}/join`),

  leave: (groupId: string) => apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/leave`),

  getMyMembership: (groupId: string) =>
    apiClient.get<ApiMyMembership>(`${GROUPS_PREFIX}/${groupId}/members/me`),

  // ---- discovery ----
  list: (params: { limit?: number; offset?: number } = {}) => {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`
    ).then((arr) => (Array.isArray(arr) ? arr.map(mapGroup) : arr));
  },

  search: (params: { q: string; limit?: number; offset?: number }) => {
    const q = params.q ?? "";
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;
    return apiClient.get<ApiGroup[]>(
      `${GROUPS_PREFIX}/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(
        limit
      )}&offset=${encodeURIComponent(offset)}`
    ).then((arr) => (Array.isArray(arr) ? arr.map(mapGroup) : arr));
  },

  listMine: () => apiClient.get<any[]>(`${GROUPS_PREFIX}/me`).then((arr) => arr),

  // ---- join requests admin ----
  listJoinRequests: (groupId: string) =>
    apiClient.get<JoinRequestsResponse>(`${GROUPS_PREFIX}/${groupId}/requests`),

  approveJoinRequest: (groupId: string, userId: string | number) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/requests/${userId}/approve`),

  rejectJoinRequest: (groupId: string, userId: string | number) =>
    apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/requests/${userId}/reject`),

  // ---- member management ----
  changeMemberRole: (groupId: string, userId: string | number, role: "admin" | "member") =>
    apiClient.patch<void>(`${GROUPS_PREFIX}/${groupId}/members/${userId}/role`, { role }),

  kickMember: (groupId: string, userId: string | number) =>
    apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}/members/${userId}`),
};
