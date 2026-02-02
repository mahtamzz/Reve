// src/hooks/useGroupChatSocket.ts
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getChatSocket, type PresenceStatus } from "@/realtime/chatSocket";

export type ChatMessage = {
  id: string;
  group_id: string;
  sender_uid: number | string;
  text: string;
  client_message_id: string | null;
  created_at: string;
};

type UseGroupChatSocketOptions = {
  groupId?: string;
  limit?: number;
};

export type PresenceMap = Record<string, PresenceStatus>;

export function useGroupChatSocket({ groupId, limit = 50 }: UseGroupChatSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastError, setLastError] = useState<{ code: string; message?: string } | null>(null);

  const [presence, setPresence] = useState<PresenceMap>({});

  const socket = useMemo(() => getChatSocket(), []);
  const joinedRef = useRef(false);

  const checkPresence = useCallback(
    (uids: Array<string | number>) => {
      if (!groupId) return;
      if (!joinedRef.current) return;

      const cleaned = [...new Set(uids.map((u) => String(u)).filter(Boolean))];
      if (cleaned.length === 0) return;

      socket.emit("presence:check", { uids: cleaned });
    },
    [socket, groupId]
  );

  useEffect(() => {
    if (!groupId) return;

    const onConnect = () => setConnected(true);

    const onDisconnect = () => {
      setConnected(false);
      setJoined(false);
      joinedRef.current = false;
      setPresence({});
    };

    const onError = (e: { code: string; message?: string }) => setLastError(e);

    const onJoined = ({ groupId: gid }: { groupId: string }) => {
      if (gid !== groupId) return;
      setJoined(true);
      joinedRef.current = true;
      socket.emit("messages:list", { groupId, limit, before: null });
    };

    const onListResult = (payload: { groupId: string; messages: ChatMessage[] }) => {
      if (payload.groupId !== groupId) return;
      setMessages([...payload.messages].reverse());
    };

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.group_id !== groupId) return;
      setMessages((prev) => {
        if (msg.client_message_id) {
          const exists = prev.some((m) => m.client_message_id === msg.client_message_id);
          if (exists) return prev;
        }
        return [...prev, msg];
      });
    };

    const onRevoked = ({ groupId: gid }: { groupId: string }) => {
      if (gid !== groupId) return;
      setJoined(false);
      joinedRef.current = false;
      setLastError({ code: "REVOKED", message: "از گروه حذف شدی." });
    };

    const onDeleted = ({ groupId: gid }: { groupId: string }) => {
      if (gid !== groupId) return;
      setJoined(false);
      joinedRef.current = false;
      setLastError({ code: "DELETED", message: "این گروه حذف شده است." });
    };

    // ✅ presence:update
    const onPresenceUpdate = (p: { uid: string | number; status: PresenceStatus }) => {
      if (!p?.uid) return;
      setPresence((prev) => ({ ...prev, [String(p.uid)]: p.status }));
    };

    // ✅ presence snapshot
    const onPresenceCheckResult = (map: Record<string, boolean>) => {
      const next: PresenceMap = {};
      for (const [k, v] of Object.entries(map || {})) {
        next[String(k)] = v ? "online" : "offline";
      }
      setPresence((prev) => ({ ...prev, ...next }));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("group:joined", onJoined);
    socket.on("messages:list:result", onListResult);
    socket.on("message:new", onNewMessage);
    socket.on("group:revoked", onRevoked);
    socket.on("group:deleted", onDeleted);

    socket.on("presence:update", onPresenceUpdate);
    socket.on("presence:check:result", onPresenceCheckResult);

    if (!socket.connected) socket.connect();
    socket.emit("group:join", { groupId });

    return () => {
      socket.emit("group:leave", { groupId });

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("group:joined", onJoined);
      socket.off("messages:list:result", onListResult);
      socket.off("message:new", onNewMessage);
      socket.off("group:revoked", onRevoked);
      socket.off("group:deleted", onDeleted);

      socket.off("presence:update", onPresenceUpdate);
      socket.off("presence:check:result", onPresenceCheckResult);
    };
  }, [socket, groupId, limit]);

  const send = useCallback(
    (text: string) => {
      if (!groupId) return;
      const trimmed = (text ?? "").trim();
      if (!trimmed) return;

      const clientMessageId = crypto.randomUUID();
      socket.emit("message:send", { groupId, text: trimmed, clientMessageId });
    },
    [socket, groupId]
  );

  return { connected, joined, messages, lastError, send, presence, checkPresence };
}
