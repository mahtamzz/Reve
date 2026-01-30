const { Server } = require("socket.io");
const JwtVerifier = require("../../../../shared/auth/JwtVerifier");
const socketAuthMiddleware = require("./socketAuth");
const registerChatHandlers = require("./chatHandlers");

const HB_INTERVAL_MS = Number(process.env.PRESENCE_HB_INTERVAL_MS || 25000);

module.exports = function createSocketServer(httpServer, container) {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:8080"],
            credentials: true
        }
    });

    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    io.use(socketAuthMiddleware(jwtVerifier));

    // helper: emit presence to rooms this socket has joined
    function emitPresenceToJoinedRooms(socket, payload) {
        const groups = socket.data?.groups;
        if (!groups || groups.size === 0) return;
        for (const groupId of groups) {
            io.to(`group:${groupId}`).emit("presence:update", payload);
        }
    }

    io.on("connection", async (socket) => {
        container.socketRegistry.track(socket);

        // IMPORTANT: ensure it exists even before handlers
        socket.data.groups = socket.data.groups || new Set();

        const uid = socket.user?.uid;
        const socketId = socket.id;

        if (uid && container.presenceStore) {
            try {
                await container.presenceStore.markOnline(uid, socketId);

                // 🔁 no global broadcast anymore
                emitPresenceToJoinedRooms(socket, { uid, status: "online" });
            } catch (e) {
                console.error("presence markOnline failed", e);
            }

            const timer = setInterval(() => {
                container.presenceStore.heartbeat(uid, socketId).catch(() => { });
            }, HB_INTERVAL_MS);

            socket.on("disconnect", async () => {
                clearInterval(timer);

                try {
                    await container.presenceStore.markOffline(uid, socketId);

                    const stillOnline = await container.presenceStore.isOnline(uid);
                    if (!stillOnline) {
                        // 🔁 no global broadcast anymore
                        emitPresenceToJoinedRooms(socket, { uid, status: "offline" });
                    }
                } catch (e) {
                    console.error("presence markOffline failed", e);
                }
            });
        }

        registerChatHandlers(io, socket, {
            groupClient: container.clients.groupClient,
            sendGroupMessage: container.useCases.sendGroupMessage,
            listGroupMessages: container.useCases.listGroupMessages,
            presenceStore: container.presenceStore // ✅ pass this in (needed below)
        });
    });

    return io;
};
