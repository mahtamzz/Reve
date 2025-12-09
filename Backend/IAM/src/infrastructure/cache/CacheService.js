const redis = require("../db/redis");

class CacheService {
    async get(key) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key, value, ttlSeconds = 300) {
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }

    async del(key) {
        await redis.del(key);
    }
}

module.exports = new CacheService();
