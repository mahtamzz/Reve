const swaggerJsdoc = require("swagger-jsdoc"); // <-- Fixed variable name
const path = require("path");
const projectRoot = path.resolve(__dirname, '..', '..');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "IAM Service API",
            version: "1.0.0",
            description: "API documentation for IAM microservice",
        },
        servers: [
            {
                url: "http://localhost:3000", // Note: This adds /api to all paths
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },

    apis: [
        path.join(projectRoot, "interfaces/http/routes/*.js")    ],
};

module.exports = swaggerJsdoc(options); 