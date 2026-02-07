// src/realtime/chatSocket.ts
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/utils/authToken";

export type PresenceStatus = "online" | "offline";

// ---------- events ----------
type ServerToClientEvents = {
  "group:joined": (payload: { groupId: string }) => void;
  "group:left": (payload: { groupId: string }) => void;

  "message:new": (msg: any) => void;
  "messages:list:result": (payload: { groupId: string; messages: any[] }) => void;

  "group:revoked": (payload: { groupId: string }) => void;
  "group:deleted": (payload: { groupId: string }) => void;

  // ✅ presence
  "presence:update": (payload: { uid: string | number; status: PresenceStatus }) => void;
  "presence:check:result": (map: Record<string, boolean>) => void;

  "error": (payload: { code: string; message?: string }) => void;

  "study_presence:update": (payload: {
    uid: string | number;
    studying: boolean;
    subjectId: string | null;
    startedAt: string | null;
    reason?: string;
  }) => void;

};

type ClientToServerEvents = {
  "group:join": (payload: { groupId: string }) => void;
  "group:leave": (payload: { groupId: string }) => void;

  "message:send": (payload: { groupId: string; text: string; clientMessageId?: string | null }) => void;
  "messages:list": (payload: { groupId: string; limit?: number; before?: string | null }) => void;

  // ✅ presence
  "presence:check": (payload: { uids: Array<string> }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getChatSocket() {
  if (socket) return socket;

  const baseUrl = import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:3006";

  socket = io(baseUrl, {
    path: "/socket.io/",
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
    extraHeaders: (() => {
      const t = getAccessToken();
      return t ? { Authorization: `Bearer ${t}` } : {};
    })(),
  });

  return socket;
}

export function resetChatSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
