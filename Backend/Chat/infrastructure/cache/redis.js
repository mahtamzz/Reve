const { createClient } = require("redis");

class RedisClient {
    constructor({ host = "redis", port = 6379 } = {}) {
        this.client = createClient({
            url: `redis://${host}:${port}`,
            socket: {
                reconnectStrategy(retries) {
                    console.log(`Redis reconnect attempt #${retries}`);
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        this.client.on("connect", () => console.log("Redis connected!"));
        this.client.on("error", (err) => console.error("Redis Error:", err));
    }

    async connect() {
        if (!this.client.isOpen) await this.client.connect();
        return this.client;
    }

    getClient() {
        return this.client;
    }
}

module.exports = RedisClient;
