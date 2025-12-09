const pool = require("../db/postgres");
const cache = require("../cache/CacheService");

class AdminRepository {
    async findByEmail(email) {
        const cacheKey = `admin:${email}`;

        // 1) Try cache
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        // 2) Fetch from DB
        const result = await pool.query(
            "SELECT * FROM admins WHERE email = $1 LIMIT 1",
            [email]
        );
        const admin = result.rows[0];

        // 3) Store in cache
        if (admin) await cache.set(cacheKey, admin, 300); // 5 minutes

        return admin;
    }

    async create(admin) {
        const result = await pool.query(
            `INSERT INTO admins (username, email, password)
             VALUES ($1, $2, $3) RETURNING *`,
            [admin.username, admin.email, admin.password]
        );
        const created = result.rows[0];

        await cache.del(`admin:${created.email}`);
        return created;
    }

    async updatePassword(email, hashedPassword) {
        await pool.query(
            "UPDATE admins SET password = $1 WHERE email = $2",
            [hashedPassword, email]
        );

        // Remove old cached version
        await cache.del(`admin:${email}`);
    }

    async findById(id) {
        const result = await pool.query(
            "SELECT id, username, email FROM admins WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }
}

module.exports = new AdminRepository();
