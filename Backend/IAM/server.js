require("dotenv").config();

const app = require("./app");
const eventBus = require("./infrastructure/messaging/EventBus");

const PORT = process.env.PORT || 3000;

async function start() {
    // 1️⃣ connect infrastructure
    await eventBus.connect();

    // 2️⃣ start HTTP server
    app.listen(PORT, () => {
        console.log(`IAM running on port ${PORT}`);
    });
}

// 3️⃣ fail fast if startup fails
start().catch(err => {
    console.error("❌ Failed to start IAM service", err);
    process.exit(1);
});
