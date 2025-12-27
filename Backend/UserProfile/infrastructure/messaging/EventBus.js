const amqp = require("amqplib");

class EventBus {
    constructor(url) {
        this.url = url;
        this.connection = null;
        this.channel = null;
    }

    async connect(retries = 10, delay = 3000) {
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(this.url);
                this.channel = await this.connection.createChannel();

                await this.channel.assertExchange("iam.events", "topic", { durable: true });

                console.log("RabbitMQ connected (user-profile)!");
                return;
            } catch (err) {
                retries--;
                console.error(`RabbitMQ connection failed (user-profile). Retries left: ${retries}`);
                if (retries === 0) throw err;
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    async publish(routingKey, payload, options = {}) {
        if (!this.channel) throw new Error("RabbitMQ channel not initialized");

        const buffer = Buffer.from(JSON.stringify(payload));

        this.channel.publish(
            "iam.events",
            routingKey,
            buffer,
            {
                persistent: true,
                messageId: options.messageId,
                correlationId: options.correlationId,
                headers: options.headers
            }
        );

        console.log("[EVENT PUBLISHED]", routingKey, payload);
    }
}

module.exports = EventBus;
