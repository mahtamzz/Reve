// // middleware/rateLimiter.js
// const { RateLimiterRedis } = require('rate-limiter-flexible');
// const redisClient = require('../DB/redis');

// // --- LOGIN LIMITER (IP-based only) ---
// const loginLimiter = new RateLimiterRedis({
//     storeClient: redisClient,
//     keyPrefix: 'login_limit',
//     points: 5,
//     duration: 60,
// });

// // --- OTP LIMITER (email-based only) ---
// const otpLimiter = new RateLimiterRedis({
//     storeClient: redisClient,
//     keyPrefix: 'otp_limit',
//     points: 3,
//     duration: 300,
// });

// const makeMiddleware = (limiter, keyFunc, { requireKey = false } = {}) => {
//     return async (req, res, next) => {
//         try {
//             // compute and normalize the key
//             const rawKey = keyFunc(req);
//             if (requireKey && (rawKey === undefined || rawKey === null || String(rawKey).trim() === '')) {
//                 // if email is required but missing, respond with a 400 (better than silently consuming undefined)
//                 return res.status(400).json({ error: 'Missing required field for rate limiting (email).' });
//             }

//             // normalize to stable string (lowercase + trimmed)
//             const key = String(rawKey || req.ip).toLowerCase().trim();

//             // DEBUG LOG — remove or lower log level in production
//             console.info(`[rateLimiter] consuming key="${key}" prefix="${limiter.keyPrefix}" route=${req.originalUrl}`);

//             await limiter.consume(key);

//             // Optionally set remaining headers by fetching the key state (optional; inexpensive)
//             // Note: rate-limiter-flexible's consume returns an object with remainingPoints in some setups.
//             // We skip that here for simplicity; you can add it if needed.

//             next();
//         } catch (err) {
//             // err is RateLimiterRes on rejection — contains msBeforeNext, consumedPoints, remainingPoints (if available)
//             const retryAfterSec = Math.ceil((err.msBeforeNext || 0) / 1000);

//             res.set('Retry-After', String(retryAfterSec));
//             if (err.remainingPoints !== undefined) {
//                 res.set('X-RateLimit-Remaining', String(Math.max(0, err.remainingPoints)));
//             } else {
//                 res.set('X-RateLimit-Remaining', '0');
//             }

//             console.warn(`[rateLimiter] blocked key error=${err.msBeforeNext ? 'rate-limit' : err.message} route=${req.originalUrl}`);

//             return res.status(429).json({ error: "Too many requests. Slow down.", retryAfter: retryAfterSec });
//         }
//     };
// };

// // exported middlewares
// const loginRateLimiter = makeMiddleware(loginLimiter, req => req.ip);
// const otpRateLimiter = makeMiddleware(otpLimiter, req => req.body?.email, { requireKey: true });

// module.exports = { loginRateLimiter, otpRateLimiter };



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
        const ip = req.ip;
        console.log("req.ip:", req.ip);
        console.log("x-real-ip:", req.headers["x-real-ip"]);
        console.log("x-forwarded-for:", req.headers["x-forwarded-for"]);
        try {
            await limiter.consume(ip);   // Only limit by IP
            next();
        } catch (err) {
            return res.status(429).json({ error: "Too many requests, slow down." });
        }
    };
};

module.exports = {
    loginLimiter: makeMiddleware(loginLimiter)
};
