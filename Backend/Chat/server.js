const http = require("http");

const createContainer = require("./container");
const createApp = require("./app");
const createSocketServer = require("./interfaces/ws/socketServer");
const env = require("./config/env");

async function start() {
    const container = await createContainer();

    // start RabbitMQ consumer(s) before accepting traffic
    if (container.consumers?.groupEventsConsumer) {
        await container.consumers.groupEventsConsumer.start();
    }

    const app = createApp(container);

    // important: use a real http server so socket.io can attach
    const server = http.createServer(app);

    // attach Socket.IO
    createSocketServer(server, container);

    server.listen(env.PORT, () => {
        console.log(`[${env.SERVICE_NAME}] running on port ${env.PORT}`);
    });
}

start().catch((err) => {
    console.error("Startup failed", err);
    process.exit(1);
});
