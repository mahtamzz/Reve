const { createClient } = require("redis");

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || "redis"}:6379`
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
    setTimeout(() => redisClient.connect(), 2000); // retry after 2s
});

(async () => {
    try {
        await redisClient.connect();
        console.log("Redis connected!");
    } catch (err) {
        console.error("Redis connection failed, retrying...", err);
    }
})();

module.exports = redisClient;



// const { createClient } = require("redis");

// const redisClient = createClient({
//     url: process.env.REDIS_URL || "redis://localhost:6379"
// });

// redisClient.on("error", (err) => console.error("Redis Error:", err));

// redisClient.connect();

// module.exports = redisClient;
