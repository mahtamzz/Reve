const amqp = require("amqplib");

class UserEventsConsumer {
    constructor(url, createUserProfileUC) {
        this.url = url;
        this.createUserProfileUC = createUserProfileUC;
    }

    async start() {
        const connection = await amqp.connect(this.url);
        const channel = await connection.createChannel();

        await channel.assertExchange("iam.events", "topic", { durable: true });

        const q = await channel.assertQueue("user-profile-service", {
            durable: true
        });

        await channel.bindQueue(q.queue, "iam.events", "user.created");

        console.log("👂 Listening for user.created events...");

        channel.consume(q.queue, async msg => {
            if (!msg) return;

            const payload = JSON.parse(msg.content.toString());
            console.log("[EVENT RECEIVED]", payload);

            try {
                await this.createUserProfileUC.execute({
                    uid: payload.uid,
                    displayName: payload.username,
                    timezone: "UTC"
                },{
                    eventId: msg.properties.messageId
                });

                channel.ack(msg);
            } catch (err) {
                console.error("Failed to process event", err);
                channel.nack(msg, false, false); // DLQ later
            }
        });
    }
}

module.exports = UserEventsConsumer;
