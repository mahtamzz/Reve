import { useCallback, useEffect, useRef, useState } from "react";
import { getStudySocket } from "@/realtime/studySocket";

export function useStudySessionRealtime() {
    const socket = getStudySocket();
    const [studying, setStudying] = useState(false);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [subjectId, setSubjectId] = useState<string | null>(null);

    // keep latest values for cleanup
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        if (!socket.connected) socket.connect();

        const onStartOk = (p: {
        studying: boolean;
        startedAt: string;
        todayMinsBase?: number;
        day?: string;
        }) => {
        if (!mountedRef.current) return;
        setStudying(true);
        setStartedAt(p.startedAt);
        };

        const onStopOk = (_p: {
        studying: boolean;
        stillStudyingElsewhere?: boolean;
        }) => {
        if (!mountedRef.current) return;
        setStudying(false);
        setStartedAt(null);
        setSubjectId(null);
        };

        const onErr = (e: { code: string; message?: string }) => {
        // optional: show toast
        console.warn("[study socket] error", e);
        };

        socket.on("study:start:ok" as any, onStartOk);
        socket.on("study:stop:ok" as any, onStopOk);
        socket.on("error", onErr);

        return () => {
        mountedRef.current = false;
        socket.off("study:start:ok" as any, onStartOk);
        socket.off("study:stop:ok" as any, onStopOk);
        socket.off("error", onErr);
        };
    }, [socket]);

    const start = useCallback(
        (sid?: string | null) => {
        if (!socket.connected) socket.connect();
        setSubjectId(sid ?? null);
        socket.emit("study:start", { subjectId: sid ?? null });
        },
        [socket],
    );

    const stop = useCallback(() => {
        if (!socket.connected) return;
        socket.emit("study:stop");
    }, [socket]);

    return { studying, startedAt, subjectId, start, stop };
}
