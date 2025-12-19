const swaggerJsdoc = require("swagger-jsdoc"); 
const path = require("path");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "User Profile Service API",
            version: "1.0.0",
            description: "API documentation for User Profile microservice",
        },
        servers: [
            {
                url: "http://localhost:3001",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "accessToken",
                },
            },
        },
        security: [
            {
                cookieAuth: [],
            },
        ],
    },
    apis: [
        path.join(__dirname, "routes/*.js"), // adjust path if needed
        path.join(__dirname, "../controllers/*.js"), // optional if you have JSDoc in controllers
    ],
};

module.exports = swaggerJsdoc(options);
