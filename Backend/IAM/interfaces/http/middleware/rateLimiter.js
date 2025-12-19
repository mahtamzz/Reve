const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../../../infrastructure/db/redis');

// Only login limiter
const loginLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_limit',
    points: 5,       // 5 attempts
    duration: 60,     // per 60 seconds
});

// Middleware factory
const makeMiddleware = limiter => {
    return async (req, res, next) => {
        // --- CRITICAL FIX START ---
        // 1. Get IP from the X-Real-IP header set by Nginx.
        // 2. Fallback to req.ip only if the header is missing (for testing/direct access).
        const clientIp = req.headers["x-real-ip"] || req.ip;

        // Log the IP being used for actual consumption
        console.log("IP for Consumption:", clientIp);
        console.log("req.ip:", req.ip);
        console.log("x-real-ip:", req.headers["x-real-ip"]);
        console.log("x-forwarded-for:", req.headers["x-forwarded-for"]);

        try {
            // Use the real client IP for consumption
            await limiter.consume(clientIp);
            next();
        } catch (err) {
            // Add headers to help client understand rate limit status
            res.setHeader('Retry-After', limiter.duration);
            return res.status(429).json({ error: "Too many requests, slow down." });
        }
    };
};

module.exports = {
    loginLimiter: makeMiddleware(loginLimiter)
};