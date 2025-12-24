const dotenv = require("dotenv");

dotenv.config();

function required(name) {
    if (!process.env[name]) {
        throw new Error(`Missing required env variable: ${name}`);
    }
    return process.env[name];
}

module.exports = {
    PORT: Number(process.env.PORT || 3003),
    SERVICE_NAME: "study-service",

    JWT_SECRET: required("JWT_SECRET"),
    JWT_ISSUER: process.env.JWT_ISSUER || "iam-service",

    PGUSER: required("PGUSER"),
    PGPASSWORD: required("PGPASSWORD"),
    PGHOST: required("PGHOST"),
    PGDATABASE: required("PGDATABASE"),
    PGPORT: Number(process.env.PGPORT || 5432),

    RABBITMQ_URL: required("RABBITMQ_URL"),
};
