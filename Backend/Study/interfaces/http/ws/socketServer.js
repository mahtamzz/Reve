const { Server } = require("socket.io");
const JwtVerifier = require("../../../../shared/auth/JwtVerifier");
const socketAuthMiddleware = require("./socketAuth");
const registerStudyHandlers = require("./studyHandlers");

const HB_INTERVAL_MS = Number(process.env.STUDY_PRESENCE_HB_INTERVAL_MS || 25000);

module.exports = function createStudySocketServer(httpServer, container) {
    const io = new Server(httpServer, {
        // Important: avoid clashing with chat socket.io path
        path: "/study-socket.io",
        cors: {
            origin: ["http://localhost:5173", "http://localhost:8080"],
            credentials: true
        }
    });

    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    io.use(socketAuthMiddleware(jwtVerifier));

    io.on("connection", (socket) => {
        socket.data.groups = socket.data.groups || new Set();

        // Heartbeat timer: keeps Redis TTL alive while the client remains connected.
        // Client should still emit "study:heartbeat" while studying;
        // this timer is an extra safety net, and also supports a client that forgets to emit.
        const uid = socket.user?.uid;
        const presence = container.studyPresenceStore;

        const timer = setInterval(() => {
            if (!uid || !presence) return;
            if (!socket.data.isStudying) return;
            presence.heartbeat(uid, socket.id).catch(() => { });
        }, HB_INTERVAL_MS);


        socket.on("disconnect", async () => {
            clearInterval(timer);

            // On disconnect, stop studying for this socket.
            // This ensures "offline" is immediate for a single-tab user.
            // If user has another tab/device studying, they remain online.
            try {
                if (!uid || !presence) return;

                const cookieHeader = socket.handshake.headers?.cookie;
                const groupClient = container.clients?.groupClient;

                const { becameOffline, meta } = await presence.stopStudying(uid, socket.id);

                if (becameOffline && cookieHeader && groupClient) {
                    // Broadcast offline to all their groups
                    const groups = await groupClient.listMyGroups({ cookieHeader });
                    for (const g of groups || []) {
                        const groupId = g.id ?? g.groupId ?? g.group_id;
                        if (!groupId) continue;
                        io.to(`group:${groupId}`).emit("study_presence:update", {
                            uid,
                            studying: false,
                            subjectId: meta?.subjectId ?? null,
                            startedAt: meta?.startedAt ?? null
                        });
                    }
                }
            } catch {
                // ignore
            }
        });

        // Handlers
        registerStudyHandlers(io, socket, {
            groupClient: container.clients?.groupClient,
            studyPresenceStore: container.studyPresenceStore,
            subjectDstRepo: container.repos?.subjectDstRepo
        });
    });

    return io;
};
