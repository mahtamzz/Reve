const amqp = require("amqplib");

class GroupEventsConsumer {
    constructor(url, { cache, socketRegistry }) {
        this.url = url;
        this.cache = cache; // redis client (node-redis)
        this.socketRegistry = socketRegistry;
    }

    async start() {
        const connection = await amqp.connect(this.url);
        const channel = await connection.createChannel();

        await channel.assertExchange("group.events", "topic", { durable: true });

        const q = await channel.assertQueue("chat-service", { durable: true });

        await channel.bindQueue(q.queue, "group.events", "group.member.removed");
        await channel.bindQueue(q.queue, "group.events", "group.deleted");

        console.log("👂 Chat listening for group.member.removed and group.deleted events...");

        channel.consume(q.queue, async (msg) => {
            if (!msg) return;

            const messageId = msg.properties.messageId || null;

            try {
                const routingKey = msg.fields.routingKey;
                const payload = JSON.parse(msg.content.toString());

                // Idempotency via Redis
                if (messageId) {
                    const seen = await this.cache.get(`evt:${messageId}`);
                    if (seen) {
                        channel.ack(msg);
                        return;
                    }
                }

                if (routingKey === "group.member.removed") {
                    const uid = parseInt(payload.uid, 10);
                    if (uid) this.socketRegistry.kickUserFromGroup(uid, payload.groupId);
                } else if (routingKey === "group.deleted") {
                    this.socketRegistry.kickAllFromGroup(payload.groupId);
                } else {
                    console.warn("Unknown routing key:", routingKey);
                }

                if (messageId) {
                    await this.cache.set(`evt:${messageId}`, "1", 7 * 24 * 60 * 60);
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Failed to process group event", err);
                channel.nack(msg, false, false);
            }
        });
    }
}

module.exports = GroupEventsConsumer;
