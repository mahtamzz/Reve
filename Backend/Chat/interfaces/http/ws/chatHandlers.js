function registerChatHandlers(io, socket, { groupClient, sendGroupMessage, listGroupMessages, presenceStore }) {
    socket.data.groups = socket.data.groups || new Set();

    socket.on("group:join", async ({ groupId }) => {
        try {
            if (!groupId) {
                return socket.emit("error", { code: "GROUP_ID_REQUIRED" });
            }

            const cookieHeader = socket.handshake.headers?.cookie;
            if (!cookieHeader) {
                return socket.emit("error", { code: "NO_AUTH_COOKIE" });
            }

            const membership = await groupClient.getMyMembership({ groupId, cookieHeader });

            if (!membership.isMember) {
                return socket.emit("error", { code: "NOT_MEMBER" });
            }

            const room = `group:${groupId}`;
            socket.join(room);
            socket.data.groups.add(groupId);

            socket.emit("group:joined", { groupId });

            // ✅ 1) Notify the room that THIS user is online (room-scoped)
            if (socket.user?.uid) {
                io.to(room).emit("presence:update", { uid: socket.user.uid, status: "online" });
            }

            // ✅ 2) (Recommended) Send presence snapshot to the JOINING client only
            // This avoids extra HTTP calls from the frontend.
            // Requires a way to know member IDs. You have 2 choices:
            //
            // Choice A: frontend already has member list from Group API -> skip this snapshot and just listen to updates.
            // Choice B: chat service fetches member list (extra dependency) -> I don't recommend.
            //
            // So I recommend A: do nothing here OR accept members in join payload.
            //
            // If you choose A: remove snapshot code entirely.
            //
            // If you choose a hybrid: client can send memberUids it already has:
            //
            // socket.emit("group:join", { groupId, memberUids: [...] })
            //
        } catch (err) {
            socket.emit("error", {
                code: err.code || "JOIN_FAILED",
                message: err.message
            });
        }
    });

    socket.on("group:leave", ({ groupId }) => {
        if (!groupId) return;

        const room = `group:${groupId}`;
        socket.leave(room);
        socket.data.groups.delete(groupId);
        socket.emit("group:left", { groupId });

        // Optional: you typically do NOT emit offline here, because user may still be online in other groups.
        // Presence is "online/offline globally" not "in this group".
    });

    socket.on("message:send", async ({ groupId, text, clientMessageId }) => {
        try {
            if (!groupId) return socket.emit("error", { code: "GROUP_ID_REQUIRED" });

            if (!socket.data.groups.has(groupId)) {
                return socket.emit("error", { code: "NOT_IN_ROOM" });
            }

            const msg = await sendGroupMessage.execute({
                groupId,
                senderUid: socket.user.uid,
                text,
                clientMessageId: clientMessageId || null
            });

            io.to(`group:${groupId}`).emit("message:new", msg);
        } catch (err) {
            socket.emit("error", { code: err.code || "SEND_FAILED", message: err.message });
        }
    });

    socket.on("messages:list", async ({ groupId, limit = 50, before = null }) => {
        try {
            if (!groupId) return socket.emit("error", { code: "GROUP_ID_REQUIRED" });

            if (!socket.data.groups.has(groupId)) {
                return socket.emit("error", { code: "NOT_IN_ROOM" });
            }

            const msgs = await listGroupMessages.execute({
                groupId,
                uid: socket.user.uid,
                limit,
                before
            });

            socket.emit("messages:list:result", { groupId, messages: msgs });
        } catch (err) {
            socket.emit("error", { code: err.code || "LIST_FAILED", message: err.message });
        }
    });

    // ✅ Optional: allow client to request presence snapshot for a list of uids (no REST)
    socket.on("presence:check", async ({ uids }) => {
        try {
            if (!presenceStore) return socket.emit("error", { code: "PRESENCE_UNAVAILABLE" });
            if (!Array.isArray(uids) || uids.length === 0) return socket.emit("presence:check:result", {});
            const map = await presenceStore.getOnlineMap(uids);
            socket.emit("presence:check:result", map);
        } catch (err) {
            socket.emit("error", { code: "PRESENCE_CHECK_FAILED", message: err.message });
        }
    });
}

module.exports = registerChatHandlers;
