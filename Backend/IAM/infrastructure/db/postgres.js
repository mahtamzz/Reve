const { Pool } = require("pg");

class PostgresClient {
    constructor(config = {}) {
        this.pool = new Pool({
            user: config.user || process.env.PGUSER || "postgres",
            host: config.host || process.env.PGHOST || "postgres",
            database: config.database || process.env.PGDATABASE || "iam_db",
            password: config.password || process.env.PGPASSWORD || "postgres",
            port: config.port || process.env.PGPORT || 5432,
        });
    }

    query(text, params) {
        return this.pool.query(text, params);
    }

    getPool() {
        return this.pool;
    }
}

module.exports = PostgresClient;
