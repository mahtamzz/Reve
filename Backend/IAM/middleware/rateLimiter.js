const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = require('../DB/redis');

const loginLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'login_limit',
    points: 5,
    duration: 60,
});

const otpLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'otp_limit',
    points: 3,
    duration: 300, 
});

const makeMiddleware = limiter => {
    return async (req, res, next) => {
        const email = req.body?.email;
        const ip = req.ip;

        try {
            // Always limit by IP
            const promises = [ limiter.consume(ip) ];

            // Also limit by email if the route has an email field
            if (email) {
                promises.push(limiter.consume(email));
            }

            await Promise.all(promises);

            next();
        } catch (err) {
            return res.status(429).json({ error: "Too many requests, slow down." });
        }
    };
};


module.exports = {
    loginRateLimiter: makeMiddleware(loginLimiter),
    otpRateLimiter: makeMiddleware(otpLimiter),
};
