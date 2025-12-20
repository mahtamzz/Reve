require("dotenv").config();
const app = require("./app");
const initContainer = require("./container"); 
const createAuthRoutes = require("./interfaces/http/routes/auth.routes");

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        // 1. Initialize DI container (Redis, DB, EventBus, etc.)
        const container = await initContainer();

        // 2. Register routes AFTER container is ready
        app.use("/api/auth", createAuthRoutes(container));

        // 3. Start HTTP server
        app.listen(PORT, () => {
            console.log(`IAM running on port ${PORT}`);
        });

    } catch (err) {
        console.error("Failed to start IAM service", err);
        process.exit(1);
    }
}

start();