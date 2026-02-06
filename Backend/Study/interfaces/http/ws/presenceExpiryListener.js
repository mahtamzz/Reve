// interfaces/http/ws/presenceExpiryListener.js
//
// Listens for Redis key expiry events and broadcasts "studying:false" when
// study:active:{uid}:meta expires.
//
// Requires Redis keyspace notifications enabled for Expired events ("Ex").
// See notes below.

function extractUidFromExpiredKey(key) {
    // key format: study:active:{uid}:meta
    const m = /^study:active:(.+):meta$/.exec(key);
    return m ? m[1] : null;
}

module.exports = async function startPresenceExpiryListener(io, redis, studyPresenceStore, opts = {}) {
    const db = Number(opts.db ?? process.env.REDIS_DB ?? 0);

    // Use a dedicated subscriber connection
    const sub = redis.duplicate();
    await sub.connect();

    // Try to enable keyspace notifications automatically (may be blocked on managed Redis)
    // If it fails, you must set it in Redis config: notify-keyspace-events Ex
    try {
        await redis.configSet("notify-keyspace-events", "Ex");
    } catch {
        // ignore; see note in response
    }

    // Expired events are published on: __keyevent@<db>__:expired
    const channel = `__keyevent@${db}__:expired`;

    await sub.subscribe(channel, async (expiredKey) => {
        try {
            const uid = extractUidFromExpiredKey(expiredKey);
            if (!uid) return;

            // Presence meta expired => treat as offline
            const groupIds = await studyPresenceStore.getRememberedGroups(uid);

            for (const groupId of groupIds) {
                io.to(`group:${groupId}`).emit("study_presence:update", {
                    uid,
                    studying: false,
                    subjectId: null,
                    startedAt: null,
                    reason: "ttl_expired"
                });
            }
        } catch {
            // swallow to avoid killing subscriber
        }
    });

    return sub; // in case you want to close it on shutdown
};
