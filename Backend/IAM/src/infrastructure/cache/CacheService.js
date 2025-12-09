const redis = require("../db/redis");
const CircuitBreaker = require("opossum");

class CacheService {
    constructor() {
        // Circuit breaker options
        const options = {
            timeout: 2000,                // 2s max per operation
            errorThresholdPercentage: 50, // open if 50% of calls fail
            resetTimeout: 10000           // try again after 10s
        };

        // Wrap Redis methods in circuit breakers
        this.getBreaker = new CircuitBreaker(async (key) => {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        }, options);

        this.setBreaker = new CircuitBreaker(async (key, value, ttlSeconds) => {
            await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
        }, options);

        this.delBreaker = new CircuitBreaker(async (key) => {
            await redis.del(key);
        }, options);

        // Optional: log breaker events
        [this.getBreaker, this.setBreaker, this.delBreaker].forEach(b => {
            b.on("open", () => console.warn("Redis breaker opened"));
            b.on("halfOpen", () => console.info("Redis breaker half-open"));
            b.on("close", () => console.info("Redis breaker closed"));
            b.on("fallback", () => console.warn("Redis operation fallback triggered"));
        });
    }

    async get(key) {
        try {
            return await this.getBreaker.fire(key);
        } catch (err) {
            console.error("CACHE GET ERROR:", err.message);
            return null; // fallback
        }
    }

    async set(key, value, ttlSeconds = 300) {
        try {
            await this.setBreaker.fire(key, value, ttlSeconds);
        } catch (err) {
            console.error("CACHE SET ERROR:", err.message);
        }
    }

    async del(key) {
        try {
            await this.delBreaker.fire(key);
        } catch (err) {
            console.error("CACHE DEL ERROR:", err.message);
        }
    }
}

module.exports = new CacheService();
