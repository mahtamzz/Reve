const amqp = require("amqplib");

class UserProfileEventsConsumer {
    constructor(url, { userRepo, cache }) {
        this.url = url;
        this.userRepo = userRepo;
        this.cache = cache;
    }

    async start() {
        const connection = await amqp.connect(this.url);
        const channel = await connection.createChannel();

        await channel.assertExchange("iam.events", "topic", { durable: true });

        const q = await channel.assertQueue("iam-service", { durable: true });
        await channel.bindQueue(q.queue, "iam.events", "user.updated");

        console.log("👂 IAM listening for user.updated events...");

        channel.consume(q.queue, async (msg) => {
            if (!msg) return;

            const messageId = msg.properties.messageId || null;

            try {
                const payload = JSON.parse(msg.content.toString());
                const { uid, changes } = payload;

                if (!uid || !changes) throw new Error("Invalid user.updated payload");

                // Idempotency (simple): skip if already processed
                // (optional but recommended)
                if (messageId) {
                    const seen = await this.cache.get(`evt:${messageId}`);
                    if (seen) {
                        channel.ack(msg);
                        return;
                    }
                }

                if (typeof changes.username === "string") {
                    await this.userRepo.updateUsernameById(uid, changes.username);
                }

                if (typeof changes.passwordHash === "string") {
                    await this.userRepo.updatePasswordHashById(uid, changes.passwordHash);
                }

                if (messageId) {
                    // keep for 7 days
                    await this.cache.set(`evt:${messageId}`, "1", 7 * 24 * 60 * 60);
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Failed to process user.updated event", err);
                channel.nack(msg, false, false); // DLQ later
            }
        });
    }
}

module.exports = UserProfileEventsConsumer;
