function toDateOnlyUTC(d = new Date()) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Broadcast to ALL groups the user belongs to.
 * This is your "not studying inside a group" requirement.
 */
async function broadcastToMyGroups(io, { groupClient }, cookieHeader, payload) {
    if (!cookieHeader) return;

    // Expected: listMyGroups returns an array. Could be [{id,...}] or [{groupId,...}] depending on your Group service.
    const groups = await groupClient.listMyGroups({ cookieHeader });

    for (const g of groups || []) {
        const groupId = g.id ?? g.groupId ?? g.group_id;
        if (!groupId) continue;
        io.to(`group:${groupId}`).emit("study_presence:update", payload);
    }
}

module.exports = function registerStudyHandlers(io, socket, deps) {
    const {
        groupClient,
        studyPresenceStore,
        subjectDstRepo // used to fetch today's base minutes (persisted, not including live delta)
    } = deps;

    socket.data.groups = socket.data.groups || new Set();

    // -----------------------------
    // Group watchers (members list)
    // -----------------------------
    socket.on("group:watch", async ({ groupId, memberUids = [] }) => {
        try {
            if (!groupId) return socket.emit("error", { code: "GROUP_ID_REQUIRED" });

            const cookieHeader = socket.handshake.headers?.cookie;
            if (!cookieHeader) return socket.emit("error", { code: "NO_AUTH_COOKIE" });

            // authorize watcher: must be a member
            const membership = await groupClient.getMyMembership({ groupId, cookieHeader });
            if (!membership?.isMember) return socket.emit("error", { code: "NOT_MEMBER" });

            const room = `group:${groupId}`;
            socket.join(room);
            socket.data.groups.add(groupId);

            socket.emit("group:watch:ok", { groupId });

            // Optional: realtime snapshot for the members list (studying + startedAt)
            // memberUids should come from the group members list you already fetched
            if (Array.isArray(memberUids) && memberUids.length > 0) {
                const activeMap = await studyPresenceStore.getActiveMany(memberUids);

                // Include today persisted mins if you want (careful: this is N queries if your repo doesn't batch)
                // We'll do a safe "best effort" approach:
                const day = toDateOnlyUTC();
                const todayBase = {};
                if (subjectDstRepo?.getTotalByDay) {
                    // This is per-uid calls; if you have big groups, implement a batch query later.
                    await Promise.all(
                        memberUids.map(async (uid) => {
                            try {
                                todayBase[String(uid)] = await subjectDstRepo.getTotalByDay(uid, day);
                            } catch {
                                todayBase[String(uid)] = 0;
                            }
                        })
                    );
                }

                socket.emit("study_presence:snapshot", {
                    groupId,
                    // { "12": {startedAt, lastHbAt, subjectId} | null }
                    active: activeMap,
                    // { "12": 37 }
                    todayMinsBase: todayBase,
                    day
                });
            }
        } catch (err) {
            socket.emit("error", {
                code: err.code || "GROUP_WATCH_FAILED",
                message: err.message
            });
        }
    });

    socket.on("group:unwatch", ({ groupId }) => {
        if (!groupId) return;
        const room = `group:${groupId}`;
        socket.leave(room);
        socket.data.groups.delete(groupId);
        socket.emit("group:unwatch:ok", { groupId });
    });

    // -----------------------------
    // Studying lifecycle
    // -----------------------------
    socket.on("study:start", async ({ subjectId = null }) => {
        try {
            const uid = socket.user?.uid;
            if (!uid) return socket.emit("error", { code: "UNAUTHORIZED" });

            const cookieHeader = socket.handshake.headers?.cookie;
            if (!cookieHeader) return socket.emit("error", { code: "NO_AUTH_COOKIE" });

            // Mark studying in Redis
            const meta = await studyPresenceStore.startStudying(
                uid,
                { subjectId, source: "socket" },
                socket.id
            );

            // persisted base minutes for today (does not include live delta)
            const day = toDateOnlyUTC(new Date(meta.startedAt));
            const todayMinsBase = subjectDstRepo?.getTotalByDay
                ? await subjectDstRepo.getTotalByDay(uid, day)
                : 0;

            // Broadcast to ALL groups the user belongs to
            await broadcastToMyGroups(
                io,
                { groupClient },
                cookieHeader,
                {
                    uid,
                    studying: true,
                    subjectId: meta.subjectId,
                    startedAt: meta.startedAt,
                    todayMinsBase,
                    day
                }
            );

            socket.emit("study:start:ok", {
                studying: true,
                startedAt: meta.startedAt,
                todayMinsBase,
                day
            });
        } catch (err) {
            socket.emit("error", {
                code: err.code || "STUDY_START_FAILED",
                message: err.message
            });
        }
    });

    socket.on("study:heartbeat", async () => {
        try {
            const uid = socket.user?.uid;
            if (!uid) return;
            await studyPresenceStore.heartbeat(uid, socket.id);
        } catch {
            // ignore heartbeat errors
        }
    });

    socket.on("study:stop", async () => {
        try {
            const uid = socket.user?.uid;
            if (!uid) return socket.emit("error", { code: "UNAUTHORIZED" });

            const cookieHeader = socket.handshake.headers?.cookie;
            if (!cookieHeader) return socket.emit("error", { code: "NO_AUTH_COOKIE" });

            const { becameOffline, meta } = await studyPresenceStore.stopStudying(uid, socket.id);

            // Only broadcast offline if this was the last socket/tab for that user.
            if (becameOffline) {
                await broadcastToMyGroups(
                    io,
                    { groupClient },
                    cookieHeader,
                    {
                        uid,
                        studying: false,
                        // optionally include last startedAt/subjectId for client cleanup
                        subjectId: meta?.subjectId ?? null,
                        startedAt: meta?.startedAt ?? null
                    }
                );
            }

            socket.emit("study:stop:ok", { studying: !becameOffline });
        } catch (err) {
            socket.emit("error", {
                code: err.code || "STUDY_STOP_FAILED",
                message: err.message
            });
        }
    });

    // -----------------------------
    // Optional: batch check for arbitrary uids (no group needed)
    // -----------------------------
    socket.on("study_presence:check", async ({ uids = [] }) => {
        try {
            if (!Array.isArray(uids) || uids.length === 0) {
                return socket.emit("study_presence:check:result", {});
            }
            const activeMap = await studyPresenceStore.getActiveMany(uids);
            socket.emit("study_presence:check:result", activeMap);
        } catch (err) {
            socket.emit("error", {
                code: "STUDY_PRESENCE_CHECK_FAILED",
                message: err.message
            });
        }
    });
};
