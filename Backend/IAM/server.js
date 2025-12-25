require("dotenv").config();
const createApp = require("./app");   // 👈 rename for clarity
const initContainer = require("./container");
const createAuthRoutes = require("./interfaces/http/routes/auth.routes");

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        // 1️⃣ Initialize container (DB, Redis, RabbitMQ, etc.)
        const container = await initContainer();

        // 2️⃣ Create express app
        const app = createApp();   // ✅ THIS WAS MISSING

        // 3️⃣ Register routes
        app.use("/api/auth", createAuthRoutes(container));

        // 4️⃣ Start server
        app.listen(PORT, () => {
            console.log(`IAM running on port ${PORT}`);
        });

    } catch (err) {
        console.error("Failed to start IAM service", err);
        process.exit(1);
    }
}

start();
