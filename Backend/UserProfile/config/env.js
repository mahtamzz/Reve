require("dotenv").config();

const env = {
    // Service
    PORT: process.env.PORT || 3001,
    SERVICE_NAME: 'user-profile-service',

    // JWT (verification only)
    JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
    JWT_ISSUER: process.env.JWT_ISSUER || 'iam-service',

    // Database (owned by this service)
    PGUSER: process.env.PGUSER || 'postgres',
    PGPASSWORD: process.env.PGPASSWORD || 'postgres',
    PGHOST: process.env.PGHOST || 'localhost',
    PGDATABASE: process.env.PGDATABASE || 'user_profile_db',
    PGPORT: process.env.PGPORT || 5432,

    RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost",

    IAM_BASE_URL: process.env.IAM_BASE_URL || "http://iam_service:3000",
};

module.exports = env;
