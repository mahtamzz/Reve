const DEFAULT_TTL = Number(process.env.PRESENCE_TTL_SECONDS || 45);

function userKey(uid) {
    return `presence:user:${uid}`;
}
function hbKey(uid, socketId) {
    return `presence:hb:${uid}:${socketId}`;
}

module.exports = function createPresenceStore(redis) {
    if (!redis) throw new Error("PresenceStore requires redis client");

    async function markOnline(uid, socketId) {
        await redis.sAdd(userKey(uid), socketId);
        await redis.set(hbKey(uid, socketId), "1", { EX: DEFAULT_TTL });
        await redis.sAdd("presence:online", String(uid));
    }

    async function heartbeat(uid, socketId) {
        // refresh TTL; also ensures membership in the user socket set
        await redis.sAdd(userKey(uid), socketId);
        await redis.set(hbKey(uid, socketId), "1", { EX: DEFAULT_TTL });
        await redis.sAdd("presence:online", String(uid));
    }

    async function markOffline(uid, socketId) {
        await redis.sRem(userKey(uid), socketId);
        await redis.del(hbKey(uid, socketId));

        const remaining = await redis.sCard(userKey(uid));
        if (remaining === 0) {
            await redis.sRem("presence:online", String(uid));
        }
    }

    async function isOnline(uid) {
        const sockets = await redis.sMembers(userKey(uid));
        if (!sockets || sockets.length === 0) return false;

        // check which heartbeat keys still exist
        const keys = sockets.map((sid) => hbKey(uid, sid));

        // mGet returns values or nulls (node-redis v4)
        const values = await redis.mGet(keys);

        const alive = [];
        for (let i = 0; i < sockets.length; i++) {
            if (values[i] !== null) alive.push(sockets[i]);
        }

        // cleanup dead socketIds (lazy cleanup)
        if (alive.length !== sockets.length) {
            const dead = sockets.filter((sid) => !alive.includes(sid));
            if (dead.length) await redis.sRem(userKey(uid), dead);
        }

        if (alive.length === 0) {
            await redis.sRem("presence:online", String(uid));
            return false;
        }

        return true;
    }

    async function getOnlineMap(uids) {
        // returns { [uid]: true/false }
        const out = {};
        await Promise.all(
            uids.map(async (uid) => {
                out[uid] = await isOnline(uid);
            })
        );
        return out;
    }

    return {
        ttlSeconds: DEFAULT_TTL,
        markOnline,
        heartbeat,
        markOffline,
        isOnline,
        getOnlineMap,
    };
};
