const { Server } = require("socket.io");
const JwtVerifier = require("../../../../shared/auth/JwtVerifier");
const socketAuthMiddleware = require("./socketAuth");
const registerStudyHandlers = require("./studyHandlers");
const startPresenceExpiryListener = require("./presenceExpiryListener");

const HB_INTERVAL_MS = Number(process.env.STUDY_PRESENCE_HB_INTERVAL_MS || 25000);

function toDateOnlyUTC(d = new Date()) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

module.exports = function createStudySocketServer(httpServer, container) {
    const io = new Server(httpServer, {
        path: "/study-socket.io",
        cors: {
            origin: ["http://localhost:5173", "http://localhost:8080"],
            credentials: true,
        },
    });

    container.io = io; // so other modules can access the same io

    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    io.use(socketAuthMiddleware(jwtVerifier));

    startPresenceExpiryListener(
        io,
        container.cache.redis,
        container.studyPresenceStore,
        { db: Number(process.env.REDIS_DB || 0) }
    ).catch(() => { });

    io.on("connection", (socket) => {
        socket.data.groups = socket.data.groups || new Set();
        socket.data.isStudying = false;

        const uid = socket.user?.uid;
        const presence = container.studyPresenceStore;

        const timer = setInterval(() => {
            if (!uid || !presence) return;
            if (!socket.data.isStudying) return;
            presence.heartbeat(uid, socket.id).catch(() => { });
        }, HB_INTERVAL_MS);

        socket.on("disconnect", async () => {
            clearInterval(timer);
            socket.data.isStudying = false;

            try {
                if (!uid || !presence) return;

                const cookieHeader = socket.handshake.headers?.cookie;
                const groupClient = container.clients?.groupClient;
                const subjectDstRepo = container.repos?.subjectDstRepo;

                const { becameOffline, meta } = await presence.stopStudying(uid, socket.id);

                // Only broadcast "offline" if this was the last active socket/tab for the user.
                if (!becameOffline) return;

                // If we can't resolve groups, we can't broadcast
                if (!cookieHeader || !groupClient) return;

                // ✅ compute updated persisted mins for today (post-stop)
                const day = toDateOnlyUTC();
                let todayMinsBase = 0;
                if (subjectDstRepo?.getTotalByDay) {
                    try {
                        todayMinsBase = await subjectDstRepo.getTotalByDay(uid, day);
                    } catch {
                        todayMinsBase = 0;
                    }
                }

                const groups = await groupClient.listMyGroups({ cookieHeader });

                for (const g of groups || []) {
                    const groupId = g.id ?? g.groupId ?? g.group_id;
                    if (!groupId) continue;

                    io.to(`group:${groupId}`).emit("study_presence:update", {
                        uid,
                        studying: false,
                        subjectId: null,
                        startedAt: null,
                        day,
                        todayMinsBase,
                        reason: "disconnect",
                    });
                }
            } catch {
                // swallow
            }
        });

        registerStudyHandlers(io, socket, {
            groupClient: container.clients?.groupClient,
            studyPresenceStore: container.studyPresenceStore,
            subjectDstRepo: container.repos?.subjectDstRepo,
        });
    });

    return io;
};
