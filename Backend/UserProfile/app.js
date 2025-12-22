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
            "http://localhost:3001"
        ],
        credentials: true
    }));

    app.use(cookieParser());
    app.use(express.json());

    const swaggerOptions = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "User Profile Service API",
                version: "1.0.0",
                description: "Profile & preferences endpoints"
            },
            servers: [
                {
                    url: "http://localhost:3001/api/profile"
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
    app.use(
        "/api/profile/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec)
    );

    app.use("/api/profile", container.routers.profileRouter);

    app.get("/health", (req, res) => {
        res.json({ status: "ok" });
    });

    return app;
}

module.exports = createApp;
