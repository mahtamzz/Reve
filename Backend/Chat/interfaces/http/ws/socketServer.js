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

    io.on("connection", async (socket) => {
        container.socketRegistry.track(socket);

        // ✅ Presence: mark online on connect
        const uid = socket.user?.uid;
        const socketId = socket.id;

        if (uid && container.presenceStore) {
            try {
                await container.presenceStore.markOnline(uid, socketId);
                // Optional broadcast (global). Your UI can filter by group.
                io.emit("presence:update", { uid, status: "online" });
            } catch (e) {
                console.error("presence markOnline failed", e);
            }

            // ✅ Heartbeat timer
            const timer = setInterval(() => {
                container.presenceStore.heartbeat(uid, socketId).catch(() => { });
            }, HB_INTERVAL_MS);

            socket.on("disconnect", async () => {
                clearInterval(timer);

                try {
                    await container.presenceStore.markOffline(uid, socketId);

                    // Only broadcast offline if user truly offline now
                    const stillOnline = await container.presenceStore.isOnline(uid);
                    if (!stillOnline) {
                        io.emit("presence:update", { uid, status: "offline" });
                    }
                } catch (e) {
                    console.error("presence markOffline failed", e);
                }
            });
        }

        registerChatHandlers(io, socket, {
            groupClient: container.clients.groupClient,
            sendGroupMessage: container.useCases.sendGroupMessage,
            listGroupMessages: container.useCases.listGroupMessages
        });
    });

    return io;
};
