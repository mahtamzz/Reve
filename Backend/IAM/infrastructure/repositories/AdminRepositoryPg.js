class AdminRepositoryPg {
    constructor({ pool, cache }) {
        this.pool = pool;
        this.cache = cache;
    }

    async findByEmail(email) {
        const cacheKey = `admin:${email}`;

        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const result = await this.pool.query(
            "SELECT * FROM admins WHERE email = $1 LIMIT 1",
            [email]
        );

        const admin = result.rows[0];
        if (admin) await this.cache.set(cacheKey, admin, 300);

        return admin;
    }

    async create(admin) {
        const result = await this.pool.query(
            `INSERT INTO admins (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [admin.username, admin.email, admin.password]
        );

        const created = result.rows[0];
        await this.cache.del(`admin:${created.email}`);

        return created;
    }

    async updatePassword(email, hashedPassword) {
        const result = await this.pool.query(
            `UPDATE admins
       SET password = $1
       WHERE email = $2
       RETURNING id, username, email`,
            [hashedPassword, email]
        );

        await this.cache.del(`admin:${email}`);
        return result.rows[0];
    }

    async findById(id) {
        const result = await this.pool.query(
            "SELECT id, username, email FROM admins WHERE id = $1",
            [id]
        );

        return result.rows[0];
    }
}

module.exports = AdminRepositoryPg;
