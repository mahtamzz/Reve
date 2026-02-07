import { useEffect, useRef, useState } from "react";
import { getStudySocket } from "@/realtime/studySocket";
console.log("[useStudyPresenceRealtime] module loaded");

type PresenceMap = Record<
  string,
  {
    studying: boolean;
    subjectId: string | null;
    startedAt: string | null;
    todayMinsBase: number;
    day: string;
  }
>;

export function useStudyPresenceRealtime(
  groupId: string | null,
  memberUids: string[]
) {
  const [presence, setPresence] = useState<PresenceMap>({});
  const socketRef = useRef<ReturnType<typeof getStudySocket> | null>(null);

  useEffect(() => {
    console.log("[useStudyPresenceRealtime] effect fired");
    if (!groupId || memberUids.length === 0) return;

    const socket = getStudySocket();
    socketRef.current = socket;

    console.log("[study socket] before connect", {
      connected: socket.connected,
      id: socket.id,
    });

    if (!socket.connected) socket.connect();

    console.log("[study socket] after connect()", {
      connected: socket.connected,
      id: socket.id,
    });

    socket.emit("group:watch", { groupId, memberUids });

    socket.on("study_presence:snapshot", (snap) => {
      if (snap.groupId !== groupId) return;

      const map: PresenceMap = {};
      for (const uid of memberUids) {
        const meta = snap.active[String(uid)] ?? null;
        map[String(uid)] = {
          studying: !!meta,
          subjectId: meta?.subjectId ?? null,
          startedAt: meta?.startedAt ?? null,
          todayMinsBase: snap.todayMinsBase[String(uid)] ?? 0,
          day: snap.day,
        };
      }
      setPresence(map);
    });

    socket.on("study_presence:update", (u) => {
      const id = String(u.uid);

      setPresence((prev) => {
        const prevRow = prev[id] ?? {
          studying: false,
          subjectId: null,
          startedAt: null,
          todayMinsBase: 0,
          day: "",
        };

        const studyingProvided = typeof (u as any).studying === "boolean";
        const nextStudying = studyingProvided ? (u as any).studying : prevRow.studying;

        return {
          ...prev,
          [id]: {
            studying: nextStudying,

            // only clear these when server explicitly says studying:false
            subjectId:
              studyingProvided && !nextStudying ? null : ((u as any).subjectId ?? prevRow.subjectId),
            startedAt:
              studyingProvided && !nextStudying ? null : ((u as any).startedAt ?? prevRow.startedAt),

            todayMinsBase: (u as any).todayMinsBase ?? prevRow.todayMinsBase,
            day: (u as any).day ?? prevRow.day,
          },
        };
      });
    });

    
    return () => {
      socket.emit("group:unwatch", { groupId });
      socket.off("study_presence:snapshot");
      socket.off("study_presence:update");
    };
  }, [groupId, memberUids.join(",")]);

  return presence;
}
