import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { studyKeys } from "@/hooks/useStudy";
import type { StudyPresenceResponse, StudyPresenceActiveMeta } from "@/api/study";
import { getChatSocket } from "@/realtime/chatSocket";

type PresenceUpdatePayload = {
  uid: string | number;
  studying: boolean;
  subjectId: string | null;
  startedAt: string | null;
  reason?: string;
};

function metaFromPayload(p: PresenceUpdatePayload): StudyPresenceActiveMeta {
  if (!p.studying) return null;
  return {
    subjectId: p.subjectId ?? null,
    startedAt: p.startedAt ?? new Date().toISOString(),
    lastHbAt: new Date().toISOString(),
    source: "socket",
  };
}

/**
 * - join room گروه تا eventهای io.to(group:gid) رو بگیری
 * - patch کردن react-query cache presence روی study_presence:update
 */
export function useStudyPresenceRealtime(args: {
  groupId: string;
  uids: Array<string | number>;
  enabled: boolean;
}) {
  const { groupId, uids, enabled } = args;

  const qc = useQueryClient();
  const socket = getChatSocket();

  const u = (uids ?? []).map(String).filter(Boolean);
  const ok = enabled && Boolean(groupId) && u.length > 0;

  useEffect(() => {
    if (!ok) return;

    // ensure connected
    if (!socket.connected) socket.connect();

    // ✅ join group room
    socket.emit("group:join", { groupId });

    const handler = (payload: PresenceUpdatePayload) => {
      const uidStr = String(payload.uid);
      if (!u.includes(uidStr)) return;

      const key = studyKeys.presence(u);

      qc.setQueryData<StudyPresenceResponse>(key, (prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          active: {
            ...prev.active,
            [uidStr]: metaFromPayload(payload),
          },
        };
      });
    };

    socket.on("study_presence:update", handler);

    return () => {
      socket.off("study_presence:update", handler);
      socket.emit("group:leave", { groupId });
      // ⚠️ اینجا disconnect نمی‌کنیم چون ممکنه چت/جاهای دیگه هم لازم داشته باشن
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, groupId, u.join(","), qc]);
}
