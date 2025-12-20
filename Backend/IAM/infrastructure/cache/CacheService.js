class CacheService {
    constructor(redisClient) {
        this.redis = redisClient;
        const CircuitBreaker = require("opossum");
        const options = {
            timeout: 2000,
            errorThresholdPercentage: 50,
            resetTimeout: 10000
        };

        this.getBreaker = new CircuitBreaker(async (key) => {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }, options);

        this.setBreaker = new CircuitBreaker(async (key, value, ttlSeconds) => {
            await this.redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
        }, options);

        this.delBreaker = new CircuitBreaker(async (key) => {
            await this.redis.del(key);
        }, options);

        [this.getBreaker, this.setBreaker, this.delBreaker].forEach(b => {
            b.on("open", () => console.warn("Redis breaker opened"));
            b.on("halfOpen", () => console.info("Redis breaker half-open"));
            b.on("close", () => console.info("Redis breaker closed"));
            b.on("fallback", () => console.warn("Redis operation fallback triggered"));
        });
    }

    async get(key) { return this.getBreaker.fire(key).catch(() => null); }
    async set(key, value, ttlSeconds = 300) { return this.setBreaker.fire(key, value, ttlSeconds).catch(console.error); }
    async del(key) { return this.delBreaker.fire(key).catch(console.error); }
}

module.exports = CacheService;
