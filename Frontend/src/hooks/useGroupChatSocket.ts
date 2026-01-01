import { useEffect, useMemo, useRef, useState } from "react";
import { getChatSocket, resetChatSocket } from "@/realtime/chatSocket";

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

export function useGroupChatSocket({ groupId, limit = 50 }: UseGroupChatSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastError, setLastError] = useState<{ code: string; message?: string } | null>(null);

  const socket = useMemo(() => getChatSocket(), []);
  const joinedRef = useRef(false);

  // connect + listeners
  useEffect(() => {
    if (!groupId) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      setConnected(false);
      setJoined(false);
      joinedRef.current = false;
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
      // بک: newest-first -> برای UI ما oldest-first بهتره، پس reverse
      const ordered = [...payload.messages].reverse();
      setMessages(ordered);
    };

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.group_id !== groupId) return;
      setMessages((prev) => {
        // جلوگیری از تکرار با client_message_id (اگر بود)
        if (msg.client_message_id) {
          const exists = prev.some(
            (m) => m.client_message_id && m.client_message_id === msg.client_message_id
          );
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

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("group:joined", onJoined);
    socket.on("messages:list:result", onListResult);
    socket.on("message:new", onNewMessage);
    socket.on("group:revoked", onRevoked);
    socket.on("group:deleted", onDeleted);

    // connect + join
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
    };
  }, [socket, groupId, limit]);

  function send(text: string) {
    if (!groupId) return;
    const trimmed = (text ?? "").trim();
    if (!trimmed) return;

    const clientMessageId = crypto.randomUUID();
    socket.emit("message:send", { groupId, text: trimmed, clientMessageId });
  }

  // helper: manual refresh
  function refresh(before: string | null = null) {
    if (!groupId) return;
    if (!joinedRef.current) return;
    socket.emit("messages:list", { groupId, limit, before });
  }

  function disconnectAll() {
    resetChatSocket();
  }

  return {
    socket,
    connected,
    joined,
    messages,
    lastError,
    send,
    refresh,
    disconnectAll,
  };
}
