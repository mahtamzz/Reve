const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

require("./config/passport");

function createApp() {
    const app = express();

    app.set("trust proxy", 1);

    app.use(
        cors({
            origin: "http://localhost:5173",
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
            exposedHeaders: ["Set-Cookie"]
        })
    );

    app.use(cookieParser());
    app.use(express.json());
    app.use(passport.initialize());

    // ---------------- Swagger ----------------
    const swaggerOptions = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "IAM Service API",
                version: "1.0.0",
                description: "Auth, OTP, password reset, Google OAuth, and identity endpoints"
            },
            servers: [{ url: "http://localhost:3000" }],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT"
                    }
                }
            }
        },
        // ✅ MUST match your real path: ./interfaces/http/routes/auth.routes.js
        apis: ["./interfaces/http/routes/*.js", "./interfaces/http/routes/**/*.js"]
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    app.get("/docs/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    // ✅ you were missing this
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // health
    app.get("/health", (req, res) => res.json({ status: "ok" }));

    return app;
}

module.exports = createApp;
