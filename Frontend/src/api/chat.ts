import { createApiClient } from "@/api/client";

const CHAT_BASE = import.meta.env.VITE_API_CHAT_BASE || "http://localhost:3006/api";
const { apiClient } = createApiClient(CHAT_BASE);

export type ChatMessage = {
  id: string;
  group_id: string;
  sender_uid: number | string;
  text: string;
  client_message_id: string | null;
  created_at: string;
};

export const chatApi = {
  listGroupMessages: (groupId: string, params?: { limit?: number; before?: string | null }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.before) q.set("before", params.before);

    const qs = q.toString();
    return apiClient.get<ChatMessage[]>(`/chat/groups/${groupId}/messages${qs ? `?${qs}` : ""}`);
  },

  sendGroupMessageHttp: (groupId: string, payload: { text: string; clientMessageId?: string | null }) => {
    return apiClient.post<ChatMessage>(`/chat/groups/${groupId}/messages`, {
      text: payload.text,
      clientMessageId: payload.clientMessageId ?? null,
    });
  },
};
