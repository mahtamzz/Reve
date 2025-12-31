const amqp = require("amqplib");
const { randomUUID } = require("crypto");

class EventBus {
    constructor(url, { exchange = "group.events" } = {}) {
        this.url = url;
        this.exchange = exchange;
        this.connection = null;
        this.channel = null;
    }

    async connect(retries = 10, delay = 3000) {
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(this.url);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(this.exchange, "topic", { durable: true });
                console.log(`RabbitMQ connected! exchange=${this.exchange}`);
                return;
            } catch (err) {
                retries--;
                console.error(`RabbitMQ connection failed. Retries left: ${retries}`);
                if (retries === 0) throw err;
                await new Promise((res) => setTimeout(res, delay));
            }
        }
    }

    async publish(routingKey, payload, { messageId } = {}) {
        if (!this.channel) throw new Error("RabbitMQ channel not initialized");

        const msgId = messageId || randomUUID();
        const buffer = Buffer.from(JSON.stringify(payload));

        console.log("[EVENT PUBLISHED]", this.exchange, routingKey, payload, "messageId=", msgId);

        this.channel.publish(
            this.exchange,
            routingKey,
            buffer,
            {
                persistent: true,
                messageId: msgId,
                timestamp: Date.now()
            }
        );

        return msgId;
    }
}

module.exports = EventBus;
