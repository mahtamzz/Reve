function registerChatHandlers(io, socket, { groupClient, sendGroupMessage, listGroupMessages }) {
    socket.data.groups = new Set();

    socket.on("group:join", async ({ groupId }) => {
        try {
            if (!groupId) {
                return socket.emit("error", { code: "GROUP_ID_REQUIRED" });
            }

            // 🔐 Cookies sent automatically by browser
            const cookieHeader = socket.handshake.headers?.cookie;
            if (!cookieHeader) {
                return socket.emit("error", { code: "NO_AUTH_COOKIE" });
            }

            const membership = await groupClient.getMyMembership({
                groupId,
                cookieHeader
            });

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

    // message:send and messages:list stay unchanged
}
