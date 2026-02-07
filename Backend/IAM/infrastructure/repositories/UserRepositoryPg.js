class UserRepositoryPg {
    constructor({ pool, cache, withRetry }) {
        this.pool = pool;
        this.cache = cache;
        this.withRetry = withRetry;
    }

    async findByEmail(email) {
        const cacheKey = `user:${email}`;

        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const result = await this.withRetry(() =>
            this.pool.query(
                "SELECT * FROM users WHERE email = $1 LIMIT 1",
                [email]
            )
        );

        const user = result.rows[0];
        if (user) await this.cache.set(cacheKey, user, 300);

        return user;
    }

    async create(user) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING *`,
                [user.username, user.email, user.password]
            )
        );

        const created = result.rows[0];
        await this.cache.del(`user:${created.email}`);

        return created;
    }

    async updatePassword(email, hashedPassword) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `UPDATE users
         SET password = $1
         WHERE email = $2
         RETURNING id, username, email`,
                [hashedPassword, email]
            )
        );

        await this.cache.del(`user:${email}`);
        return result.rows[0];
    }

    async updateUsernameById(id, username) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `UPDATE users
                SET username = $1
                WHERE id = $2
                RETURNING id, username, email`,
                [username, id]
            )
        );

        const updated = result.rows[0];
        if (updated?.email) await this.cache.del(`user:${updated.email}`);
        return updated;
    }

    async updatePasswordHashById(id, passwordHash) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `UPDATE users
                SET password = $1
                WHERE id = $2
                RETURNING id, username, email`,
                [passwordHash, id]
            )
        );

        const updated = result.rows[0];
        if (updated?.email) await this.cache.del(`user:${updated.email}`);
        return updated;
    }


    async findById(id) {
        const result = await this.withRetry(() =>
            this.pool.query(
                "SELECT id, username, email FROM users WHERE id = $1",
                [id]
            )
        );

        return result.rows[0];
    }

    async findByGoogleIdOrEmail(googleId, email) {
        const cacheKey = `user_google:${googleId || "none"}:${email || "none"}`;

        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const result = await this.withRetry(() =>
            this.pool.query(
                "SELECT * FROM users WHERE googleid = $1 OR email = $2 LIMIT 1",
                [googleId, email]
            )
        );

        const user = result.rows[0];
        if (user) await this.cache.set(cacheKey, user, 300);

        return user;
    }

    async createGoogleUser({ googleid, email, username }) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `INSERT INTO users (googleid, email, username)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [googleid, email, username]
            )
        );

        const user = result.rows[0];
        await this.cache.del(`user:${email}`);
        await this.cache.del(`user_google:${googleid}:${email}`);

        return user;
    }

    async findAuthById(id) {
        const result = await this.withRetry(() =>
            this.pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id])
        );
        return result.rows[0] || null;
    }

    async listUsers({ limit, offset }) {
        const usersQuery = `
        SELECT id, email, username, googleid
        FROM users
        ORDER BY id DESC
        LIMIT $1 OFFSET $2
        `;

        const countQuery = `SELECT COUNT(*) FROM users`;

        const [usersRes, countRes] = await Promise.all([
            this.withRetry(() =>
                this.pool.query(usersQuery, [limit, offset])
            ),
            this.withRetry(() =>
                this.pool.query(countQuery)
            )
        ]);

        return {
            users: usersRes.rows,
            total: Number(countRes.rows[0].count)
        };
    }

    async deleteById(userId) {
        const result = await this.withRetry(() =>
            this.pool.query(
                `DELETE FROM users
                WHERE id = $1
                RETURNING id, email`,
                [userId]
            )
        );

        const deleted = result.rows[0];
        if (!deleted) return null;

        if (deleted.email) {
            await this.cache.del(`user:${deleted.email}`);
        }

        return deleted;
    }


}

module.exports = UserRepositoryPg;
