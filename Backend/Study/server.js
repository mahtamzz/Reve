const http = require("http");
const createContainer = require("./container");
const createApp = require("./app");
const env = require("./config/env");

const createStudySocketServer = require("./interfaces/http/ws/socketServer");

async function start() {
    const container = await createContainer();
    const app = createApp(container);

    const httpServer = http.createServer(app);

    // attach socket server
    createStudySocketServer(httpServer, container);

    httpServer.listen(env.PORT, "0.0.0.0", () => {
        console.log(`[${env.SERVICE_NAME}] running on port ${env.PORT}`);
      });
      
}

start().catch(err => {
    console.error("Startup failed", err);
    process.exit(1);
});
