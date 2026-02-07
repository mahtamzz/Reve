// src/api/groups.ts
import { groupsClient as apiClient, ApiError } from "@/api/client";
import type {
  ApiGroup,
  ApiGroupDetailsResponse,
  ApiGroupMember,
  ApiListGroupMembersResponse,
  GroupVisibility,
} from "@/api/types";

const GROUPS_PREFIX = "/groups";

export type CreateGroupBody = {
  name: string;
  description?: string | null;
  visibility?: GroupVisibility;
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
  id?: string;
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

function mapGroup(raw: any): ApiGroup {
  if (!raw) return raw;
  return {
    ...raw,
    weekly_xp: raw.weekly_xp ?? raw.weeklyXp ?? null,
    minimum_dst_mins: raw.minimum_dst_mins ?? raw.minimumDstMins ?? null,
  };
}

function normalizeMembersPayload(raw: any): ApiGroupMember[] {
  if (raw && Array.isArray(raw.items)) return raw.items;
  if (raw && Array.isArray(raw.members)) return raw.members;
  if (Array.isArray(raw)) return raw;
  return [];
}

function normalizeJoinRequestsPayload(
  groupId: string,
  raw: any
): JoinRequestsResponse {
  if (raw && Array.isArray(raw.items)) {
    return {
      groupId: raw.groupId ?? groupId,
      total: raw.total ?? raw.items.length,
      items: raw.items,
    };
  }

  if (Array.isArray(raw)) {
    return {
      groupId,
      total: raw.length,
      items: raw,
    };
  }

  return { groupId, total: 0, items: [] };
}

function minimalPrivateGroup(groupId: string): ApiGroup {
  return {
    id: groupId,
    name: "Private group",
    description: "Join this private group to see full details.",
    visibility: "private",
    weekly_xp: null,
    minimum_dst_mins: null,
  };
}

export const groupsApi = {

  async getGroup(groupId: string): Promise<ApiGroup> {
    try {
      const res = await apiClient.get<any>(`${GROUPS_PREFIX}/${groupId}`);
      const g = res?.group ?? res;
      return mapGroup(g);
    } catch (e: any) {
      // private group preview
      if (e instanceof ApiError && e.status === 403) {
        return minimalPrivateGroup(groupId);
      }
      throw e;
    }
  },

  async getDetails(groupId: string): Promise<ApiGroupDetailsResponse> {
    const group = await groupsApi.getGroup(groupId);

    let members: ApiGroupMember[] = [];
    try {
      const res = await apiClient.get<ApiListGroupMembersResponse>(
        `${GROUPS_PREFIX}/${groupId}/members`
      );
      members = normalizeMembersPayload(res);
    } catch (e: any) {
      // 403/401 is fine for private groups
      if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) {
        throw e;
      }
    }

    return { group, members };
  },

  create(body: CreateGroupBody) {
    return apiClient
      .post<ApiGroup>(GROUPS_PREFIX, {
        name: body.name,
        description: body.description ?? null,
        visibility: body.visibility ?? "public",
        weeklyXp: body.weeklyXp ?? undefined,
        minimumDstMins: body.minimumDstMins ?? undefined,
      })
      .then(mapGroup);
  },

  update(groupId: string, fields: UpdateGroupBody) {
    return apiClient
      .patch<ApiGroup>(`${GROUPS_PREFIX}/${groupId}`, {
        ...(fields.name !== undefined ? { name: fields.name } : {}),
        ...(fields.description !== undefined
          ? { description: fields.description }
          : {}),
        ...(fields.visibility !== undefined
          ? { visibility: fields.visibility }
          : {}),
        ...(fields.weeklyXp !== undefined
          ? { weeklyXp: fields.weeklyXp }
          : {}),
        ...(fields.minimumDstMins !== undefined
          ? { minimumDstMins: fields.minimumDstMins }
          : {}),
      })
      .then(mapGroup);
  },

  remove(groupId: string) {
    return apiClient.delete<void>(`${GROUPS_PREFIX}/${groupId}`);
  },


  
  join(groupId: string) {
    return apiClient.post<{ status: "joined" | "requested" }>(
      `${GROUPS_PREFIX}/${groupId}/join`
    );
  },

  leave(groupId: string) {
    return apiClient.post<void>(`${GROUPS_PREFIX}/${groupId}/leave`);
  },

  getMyMembership(groupId: string) {
    return apiClient.get<ApiMyMembership>(
      `${GROUPS_PREFIX}/${groupId}/members/me`
    );
  },


  async listMembers(groupId: string): Promise<ApiListGroupMembersResponse> {
    const res = await apiClient.get<any>(
      `${GROUPS_PREFIX}/${groupId}/members`
    );

    const items = normalizeMembersPayload(res);

    return {
      groupId,
      total: res?.total ?? items.length,
      items,
    };
  },

  changeMemberRole(
    groupId: string,
    userId: string | number,
    role: "admin" | "member"
  ) {
    return apiClient.patch<void>(
      `${GROUPS_PREFIX}/${groupId}/members/${userId}/role`,
      { role }
    );
  },

  kickMember(groupId: string, userId: string | number) {
    return apiClient.delete<void>(
      `${GROUPS_PREFIX}/${groupId}/members/${userId}`
    );
  },


  async listJoinRequests(groupId: string): Promise<JoinRequestsResponse> {
    const raw = await apiClient.get<any>(
      `${GROUPS_PREFIX}/${groupId}/requests`
    );
    return normalizeJoinRequestsPayload(groupId, raw);
  },

  approveJoinRequest(
    groupId: string,
    userId: string | number
  ) {
    return apiClient.post<void>(
      `${GROUPS_PREFIX}/${groupId}/requests/${userId}/approve`
    );
  },

  rejectJoinRequest(
    groupId: string,
    userId: string | number
  ) {
    return apiClient.post<void>(
      `${GROUPS_PREFIX}/${groupId}/requests/${userId}/reject`
    );
  },


  list(params: { limit?: number; offset?: number } = {}) {
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    return apiClient
      .get<ApiGroup[]>(
        `${GROUPS_PREFIX}?limit=${limit}&offset=${offset}`
      )
      .then((arr) => (Array.isArray(arr) ? arr.map(mapGroup) : []));
  },

  search(params: { q: string; limit?: number; offset?: number }) {
    const q = params.q ?? "";
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    return apiClient
      .get<ApiGroup[]>(
        `${GROUPS_PREFIX}/search?q=${encodeURIComponent(
          q
        )}&limit=${limit}&offset=${offset}`
      )
      .then((arr) => (Array.isArray(arr) ? arr.map(mapGroup) : []));
  },

  listMine() {
    return apiClient.get<ApiGroup[]>(`${GROUPS_PREFIX}/me`);
  },
};
