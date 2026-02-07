import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/utils/authToken";

/* ------------------ types ------------------ */

export type StudyPresenceActiveMeta = null | {
    subjectId?: string | null;
    startedAt: string;
    lastHbAt?: string;
};

export type StudyPresenceSnapshot = {
    groupId: string;
    day: string; // YYYY-MM-DD (UTC)
    active: Record<string, StudyPresenceActiveMeta>;
    todayMinsBase: Record<string, number>;
};

type ServerToClientEvents = {
    "study_presence:snapshot": (payload: StudyPresenceSnapshot) => void;

    "study_presence:update": (payload: {
        uid: string | number;
        studying: boolean;
        subjectId: string | null;
        startedAt: string | null;
        todayMinsBase?: number;
        day?: string;
        reason?: string;
    }) => void;

    "group:watch:ok": (payload: { groupId: string }) => void;
    "group:unwatch:ok": (payload: { groupId: string }) => void;

    error: (payload: { code: string; message?: string }) => void;
};

type ClientToServerEvents = {
    "group:watch": (payload: { groupId: string; memberUids: string[] }) => void;
    "group:unwatch": (payload: { groupId: string }) => void;

    "study:start": (payload: { subjectId?: string | null }) => void;
    "study:stop": () => void;
};

/* ------------------ singleton ------------------ */

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getStudySocket() {
    if (socket) return socket;

    const baseUrl =
        import.meta.env.VITE_STUDY_SOCKET_URL || "http://localhost:3007";

    socket = io(baseUrl, {
        path: "/study-socket.io",
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

export function resetStudySocket() {
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
}
