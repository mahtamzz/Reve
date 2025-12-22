const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

function createApp(container) {
    const app = express();

    app.set("trust proxy", 1);

    app.use(cors({
        origin: "http://localhost:5173",
        credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());

    app.use("/api/profile", container.routers.profileRouter);

    app.get("/health", (req, res) => {
        res.json({ status: "ok" });
    });

    return app;
}

module.exports = createApp;
