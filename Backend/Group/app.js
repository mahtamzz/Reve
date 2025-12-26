const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

function createApp(container) {
    const app = express();

    app.set("trust proxy", 1);

    app.use(cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:3002"
        ],
        credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());

    const swaggerOptions = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "Group Service API",
                version: "1.0.0",
                description: "Groups, members, and join requests"
            },
            servers: [
                {
                    url: "http://localhost:3002"
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                }
            },
            security: [{ bearerAuth: [] }]
        },
        apis: [
            "./interfaces/http/routes/*.js"
        ]
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.use("/api/groups", container.routers.groupRouter);

    app.get("/health", (req, res) => {
        res.json({ status: "ok" });
    });

    app.use((err, req, res, next) => {
        const msg = String(err?.message || "Internal Server Error");
      
        if (msg === "Group not found") return res.status(404).json({ error: msg });
        if (msg === "Access denied") return res.status(403).json({ error: msg });
        if (msg === "Not a member") return res.status(403).json({ error: msg });
      
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      });
      

    return app;
}

module.exports = createApp;
