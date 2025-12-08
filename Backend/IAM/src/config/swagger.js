const swaggerJsDoc = require("swagger-jsdoc");

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
                url: "http://localhost:3000",
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

    apis: ["./routes/*.js"],  
};

module.exports = swaggerJsDoc(options);
