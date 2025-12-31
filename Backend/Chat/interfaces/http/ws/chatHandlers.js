function registerChatHandlers(io, socket, { groupClient, sendGroupMessage, listGroupMessages }) {
    socket.data.groups = new Set();

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

            socket.join(`group:${groupId}`);
            socket.data.groups.add(groupId);

            socket.emit("group:joined", { groupId });
        } catch (err) {
            socket.emit("error", {
                code: err.code || "JOIN_FAILED",
                message: err.message
            });
        }
    });

    socket.on("group:leave", ({ groupId }) => {
        if (!groupId) return;
        socket.leave(`group:${groupId}`);
        socket.data.groups.delete(groupId);
        socket.emit("group:left", { groupId });
    });

    socket.on("message:send", async ({ groupId, text, clientMessageId }) => {
        try {
            if (!groupId) return socket.emit("error", { code: "GROUP_ID_REQUIRED" });

            // MVP authorization: must have joined
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
}

module.exports = registerChatHandlers;
