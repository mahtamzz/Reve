const dotenv = require("dotenv");

dotenv.config();

function required(name) {
    if (!process.env[name]) {
        throw new Error(`Missing required env variable: ${name}`);
    }
    return process.env[name];
}

module.exports = {
    PORT: Number(process.env.PORT || 3004),
    SERVICE_NAME: "media-service",

    JWT_SECRET: required("JWT_SECRET"),
    JWT_ISSUER: process.env.JWT_ISSUER || "iam-service",

    PGUSER: required("PGUSER"),
    PGPASSWORD: required("PGPASSWORD"),
    PGHOST: required("PGHOST"),
    PGDATABASE: required("PGDATABASE"),
    PGPORT: Number(process.env.PGPORT || 5432),

    // Where to store uploaded files inside the container
    UPLOADS_DIR: process.env.UPLOADS_DIR || "/app/Media/uploads",

    // e.g. 2097152 = 2MB
    AVATAR_MAX_BYTES: Number(process.env.AVATAR_MAX_BYTES || 2 * 1024 * 1024)
};
