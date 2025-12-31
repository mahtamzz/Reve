class SocketRegistry {
    constructor() {
        this.userSockets = new Map(); // uid -> Set(socket)
    }

    track(socket) {
        const uid = socket.user?.uid;
        if (!uid) return;

        if (!this.userSockets.has(uid)) this.userSockets.set(uid, new Set());
        this.userSockets.get(uid).add(socket);

        socket.on("disconnect", () => {
            const set = this.userSockets.get(uid);
            if (!set) return;
            set.delete(socket);
            if (set.size === 0) this.userSockets.delete(uid);
        });
    }

    kickUserFromGroup(uid, groupId) {
        const set = this.userSockets.get(uid);
        if (!set) return 0;

        const room = `group:${groupId}`;
        let count = 0;

        for (const socket of set) {
            socket.leave(room);
            socket.data.groups?.delete(groupId);
            socket.emit("group:revoked", { groupId });
            count++;
        }

        return count;
    }

    kickAllFromGroup(groupId) {
        const room = `group:${groupId}`;
        let count = 0;

        for (const [, sockets] of this.userSockets.entries()) {
            for (const socket of sockets) {
                socket.leave(room);
                socket.data.groups?.delete(groupId);
                socket.emit("group:deleted", { groupId });
                count++;
            }
        }
        return count;
    }
}

module.exports = SocketRegistry;
