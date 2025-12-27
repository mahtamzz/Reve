// infrastructure/auth/RefreshTokenStore.js
const crypto = require("crypto");

class RefreshTokenStore {
    constructor(cache) {
        this.cache = cache; // your CacheService
    }

    key(uid) {
        return `refresh_jti:${uid}`;
    }

    // store new jti with TTL
    async set(uid, jti, ttlSeconds) {
        // store only a hash of jti (optional but nicer)
        const jtiHash = crypto.createHash("sha256").update(jti).digest("hex");
        await this.cache.set(this.key(uid), jtiHash, ttlSeconds);
        return jtiHash;
    }

    async get(uid) {
        return this.cache.get(this.key(uid)); // returns jtiHash or null
    }

    async matches(uid, jti) {
        const stored = await this.get(uid);
        if (!stored) return false;

        const jtiHash = crypto.createHash("sha256").update(jti).digest("hex");
        return stored === jtiHash;
    }

    async revoke(uid) {
        await this.cache.del(this.key(uid));
    }
}

module.exports = RefreshTokenStore;
