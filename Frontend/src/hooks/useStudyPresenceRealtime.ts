import { useEffect, useRef, useState } from "react";
import { getStudySocket } from "@/realtime/studySocket";

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
    if (!groupId || memberUids.length === 0) return;

    const socket = getStudySocket();
    socketRef.current = socket;

    if (!socket.connected) socket.connect();

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
      setPresence((prev) => ({
        ...prev,
        [String(u.uid)]: {
          studying: u.studying,
          subjectId: u.subjectId ?? null,
          startedAt: u.startedAt ?? null,
          todayMinsBase: prev[String(u.uid)]?.todayMinsBase ?? 0,
          day: prev[String(u.uid)]?.day ?? "",
        },
      }));
    });

    return () => {
      socket.emit("group:unwatch", { groupId });
      socket.off("study_presence:snapshot");
      socket.off("study_presence:update");
    };
  }, [groupId, memberUids.join(",")]);

  return presence;
}
