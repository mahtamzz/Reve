const pool = require("../db/postgres");
const cache = require("../cache/CacheService");

class UserRepository {
    async findByEmail(email) {
        const cacheKey = `user:${email}`;

        // 1) Try cache
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        // 2) Fetch DB
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 LIMIT 1",
            [email]
        );
        const user = result.rows[0];

        // 3) Store in cache
        if (user) await cache.set(cacheKey, user, 300); // 5 minutes

        return user;
    }

    async create(user) {
        const result = await pool.query(
            `INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3) RETURNING *`,
            [user.username, user.email, user.password]
        );
        const created = result.rows[0];

        // Invalidate any existing cache for this email
        await cache.del(`user:${created.email}`);

        return created;
    }

    async updatePassword(email, hashedPassword) {
        const result = await pool.query(
            "UPDATE users SET password = $1 WHERE email = $2 RETURNING id, username, email",
            [hashedPassword, email]
        );

        // Password changed → remove old cached version
        await cache.del(`user:${email}`);

        return result.rows[0]; // now this will be the updated user
    }

    async findById(id) {
        const result = await pool.query(
            "SELECT id, username, email FROM users WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }

    async findByGoogleIdOrEmail(googleId, email) {
        const cacheKey = `user_google:${googleId || "none"}:${email || "none"}`;

        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        const result = await pool.query(
            "SELECT * FROM users WHERE googleid = $1 OR email = $2 LIMIT 1",
            [googleId, email]
        );

        const user = result.rows[0];

        if (user) await cache.set(cacheKey, user, 300);

        return user;
    }

    async createGoogleUser({ googleid, email, username }) {
        const result = await pool.query(
            `INSERT INTO users (googleid, email, username)
            VALUES ($1, $2, $3)
             RETURNING *`,
            [googleid, email, username]
        );

        const user = result.rows[0];

        // Clear all related cached entries
        await cache.del(`user:${email}`);
        await cache.del(`user_google:${googleid}:${email}`);

        return user;
    }
}

module.exports = new UserRepository();
