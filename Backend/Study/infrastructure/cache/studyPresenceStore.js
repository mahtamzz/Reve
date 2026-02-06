// Study/infrastructure/cache/studyPresenceStore.js
//
// Semantics: "online" === "currently studying".
// Uses Redis TTL so crash/network drop auto-clears.
//
// Data model (multi-device):
// - study:active:{uid}:meta  -> JSON string { startedAt, subjectId, lastHbAt, source }
// - study:active:{uid}:socks -> SET of socketIds (or connection ids), TTL refreshed
//
// User is considered studying if:
// - meta key exists (and not expired), AND
// - socks set has at least one socket (optional strictness; we enforce this)
//
// If you don't want socketIds at all (e.g. heartbeats over HTTP), you can
// still use this store by passing a stable "connId" or omit socket logic
// and treat meta existence as the source of truth.

const DEFAULT_TTL_SECONDS = Number(process.env.STUDY_PRESENCE_TTL_SECONDS || 75);
const DEFAULT_HB_INTERVAL_MS = Number(process.env.STUDY_PRESENCE_HB_INTERVAL_MS || 25000);

function keyMeta(uid) {
    return `study:active:${uid}:meta`;
}
function keySocks(uid) {
    return `study:active:${uid}:socks`;
}

function keyGroups(uid) {
    return `study:active:${uid}:groups`;
}

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

module.exports = function createStudyPresenceStore(redis, opts = {}) {
    const ttlSeconds = Number(opts.ttlSeconds || DEFAULT_TTL_SECONDS);

    // For convenience if you want to export it to clients
    const hbIntervalMs = Number(opts.hbIntervalMs || DEFAULT_HB_INTERVAL_MS);

    /**
     * Start studying for a uid, tracked under a particular socket/connection.
     *
     * @param {number|string} uid
     * @param {object} payload
     * @param {string|null} payload.subjectId
     * @param {string|null} payload.startedAt ISO string; if omitted, server time used.
     * @param {string|null} payload.source optional "web"|"mobile"|etc
     * @param {string} socketId required to support multi-device correctly
     */
    async function startStudying(uid, { subjectId = null, startedAt = null, source = "socket" } = {}, socketId) {
        if (!uid) throw new Error("uid is required");
        if (!socketId) throw new Error("socketId is required");

        const nowIso = new Date().toISOString();
        const meta = {
            subjectId,
            startedAt: startedAt || nowIso,
            lastHbAt: nowIso,
            source
        };

        const mKey = keyMeta(uid);
        const sKey = keySocks(uid);

        // Use MULTI so meta + socket set + TTLs are consistent
        const tx = redis.multi();
        tx.set(mKey, JSON.stringify(meta), { EX: ttlSeconds });
        tx.sAdd(sKey, socketId);
        tx.expire(sKey, ttlSeconds);
        await tx.exec();

        return meta;
    }

    /**
     * Heartbeat refresh (keeps user "studying online").
     * Safe to call frequently.
     */
    async function heartbeat(uid, socketId) {
        if (!uid) throw new Error("uid is required");
        if (!socketId) throw new Error("socketId is required");

        const mKey = keyMeta(uid);
        const sKey = keySocks(uid);

        // Only heartbeat if this socket is already marked as studying
        const isMember = await redis.sIsMember(sKey, socketId);
        if (!isMember) return false;

        const metaJson = await redis.get(mKey);
        if (!metaJson) return false;

        const meta = safeParse(metaJson) || {};
        meta.lastHbAt = new Date().toISOString();

        const tx = redis.multi();
        tx.set(mKey, JSON.stringify(meta), { EX: ttlSeconds });
        tx.expire(sKey, ttlSeconds);
        await tx.exec();

        return true;
    }

    /**
     * Stop studying for this socket.
     * If it was the last active socket for the uid, clears meta too.
     *
     * Returns:
     *  - { becameOffline: boolean, meta: object|null }
     */
    async function stopStudying(uid, socketId) {
        if (!uid) throw new Error("uid is required");
        if (!socketId) throw new Error("socketId is required");

        const mKey = keyMeta(uid);
        const sKey = keySocks(uid);

        // Remove socketId from set
        await redis.sRem(sKey, socketId);

        const remaining = await redis.sCard(sKey);

        if (remaining <= 0) {
            // fully offline
            const metaJson = await redis.get(mKey);
            const meta = metaJson ? safeParse(metaJson) : null;

            const tx = redis.multi();
            tx.del(sKey);
            tx.del(mKey);
            await tx.exec();

            return { becameOffline: true, meta };
        }

        // Still studying on another device/tab; keep meta, refresh TTL
        const tx = redis.multi();
        tx.expire(sKey, ttlSeconds);
        tx.expire(mKey, ttlSeconds);
        await tx.exec();

        const metaJson = await redis.get(mKey);
        return { becameOffline: false, meta: metaJson ? safeParse(metaJson) : null };
    }

    /**
     * Check if user is currently studying.
     */
    async function isStudying(uid) {
        if (!uid) return false;
        const sKey = keySocks(uid);
        const count = await redis.sCard(sKey);
        return count > 0;
    }

    /**
     * Get active study meta for one uid.
     * Returns null if not studying (or no meta).
     */
    async function getActive(uid) {
        if (!uid) return null;
        const studying = await isStudying(uid);
        if (!studying) return null;

        const metaJson = await redis.get(keyMeta(uid));
        return metaJson ? safeParse(metaJson) : null;
    }

    /**
     * Batch: returns map { [uid]: true/false }
     * Accepts string or number uids.
     */
    async function getStudyingMap(uids) {
        if (!Array.isArray(uids) || uids.length === 0) return {};

        const tx = redis.multi();
        for (const uid of uids) {
            tx.sCard(keySocks(uid));
        }
        const results = await tx.exec(); // array of [err, value] pairs
        const out = {};
        for (let i = 0; i < uids.length; i++) {
            const uid = String(uids[i]);
            const val = results?.[i]?.[1];
            out[uid] = Number(val || 0) > 0;
        }
        return out;
    }

    /**
     * Batch: returns map { [uid]: meta|null } only for those currently studying.
     * This does two passes (sCard + get) to avoid unnecessary GETs.
     */
    async function getActiveMany(uids) {
        if (!Array.isArray(uids) || uids.length === 0) return {};

        // 1) Determine who is studying (via sCard)
        const tx1 = redis.multi();
        for (const uid of uids) tx1.sCard(keySocks(uid));
        const cards = await tx1.exec();

        const studyingUids = [];
        for (let i = 0; i < uids.length; i++) {
            if (Number(cards?.[i]?.[1] || 0) > 0) studyingUids.push(String(uids[i]));
        }

        // 2) Fetch meta for those
        const out = {};
        if (studyingUids.length === 0) {
            // everyone null
            for (const uid of uids) out[String(uid)] = null;
            return out;
        }

        const tx2 = redis.multi();
        for (const uid of studyingUids) tx2.get(keyMeta(uid));
        const metas = await tx2.exec();

        // fill defaults
        for (const uid of uids) out[String(uid)] = null;

        for (let i = 0; i < studyingUids.length; i++) {
            const uid = studyingUids[i];
            const json = metas?.[i]?.[1];
            out[uid] = json ? safeParse(json) : null;
        }

        return out;
    }

    async function rememberGroups(uid, groupIds = []) {
        if (!uid) throw new Error("uid is required");
        if (!Array.isArray(groupIds)) throw new Error("groupIds must be an array");

        const gKey = keyGroups(uid);

        const tx = redis.multi();
        if (groupIds.length > 0) tx.sAdd(gKey, groupIds.map(String));
        // keep this longer than presence TTL so expiry broadcaster can still find groups
        tx.expire(gKey, 60 * 60 * 24); // 24h
        await tx.exec();
        return true;
    }

    async function getRememberedGroups(uid) {
        if (!uid) return [];
        const gKey = keyGroups(uid);
        const groups = await redis.sMembers(gKey);
        return (groups || []).filter(Boolean);
    }

    return {
        ttlSeconds,
        hbIntervalMs,

        startStudying,
        heartbeat,
        stopStudying,

        isStudying,
        getActive,

        getStudyingMap,
        getActiveMany,

        rememberGroups,
        getRememberedGroups
    };

};
