const { createClient } = require("redis");

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || "redis"}:6379`,
    socket: {
        reconnectStrategy(retries) {
            console.log(`Redis reconnect attempt #${retries}`);
            return Math.min(retries * 100, 3000); // max 3s delay
        }
    }
});

redisClient.on("connect", () => {
    console.log("Redis connected!");
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
});

// Only one connect call
redisClient.connect();

module.exports = redisClient;