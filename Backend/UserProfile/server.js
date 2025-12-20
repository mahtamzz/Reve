const createContainer = require("./container");
const createApp = require("./app");
const env = require("./config/env");

async function start() {
    const container = await createContainer();

    // Start event consumer
    await container.consumers.userEventsConsumer.start();

    // Start HTTP server
    const app = createApp(container);
    app.listen(env.PORT, () => {
        console.log(`[${env.SERVICE_NAME}] running on port ${env.PORT}`);
    });
}

start().catch(err => {
    console.error("Startup failed", err);
    process.exit(1);
});
