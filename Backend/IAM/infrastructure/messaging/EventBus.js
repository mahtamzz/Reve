const amqp = require("amqplib");

class EventBus {
    async connect(retries = 10, delay = 3000) {
        while (retries > 0) {
            try {
                this.connection = await amqp.connect(process.env.RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange("iam.events", "topic", {
                    durable: true
                });

                console.log("RabbitMQ connected!");
                return;
            } catch (err) {
                retries--;
                console.error(
                    `RabbitMQ connection failed. Retries left: ${retries}`
                );
                if (retries === 0) throw err;
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }

    async publish(routingKey, payload) {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not initialized");
        }
        const buffer = Buffer.from(JSON.stringify(payload));
        this.channel.publish("iam.events", routingKey, buffer, {
            persistent: true
        });
    }
}

module.exports = new EventBus();
