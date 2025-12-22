require("dotenv").config();

const env = {
    PORT: process.env.PORT || 3000,
    SERVICE_NAME: 'iam-service',

    JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGHOST: process.env.PGHOST,
    PGDATABASE: process.env.PGDATABASE,
    PGPORT: process.env.PGPORT,
    REDIS_HOST: process.env.REDIS_HOST,
};

module.exports = env;
