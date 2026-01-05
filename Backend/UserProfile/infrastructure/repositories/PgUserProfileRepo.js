const UserProfileRepository = require('../../domain/repositories/UserProfileRepo');

class PgUserProfileRepository extends UserProfileRepository {
    constructor({ pool }) {
        super();
        if (!pool) {
            throw new Error("Postgres pool is required");
        }
        this.pool = pool;
    }

    async create({ uid, displayName, timezone }) {
        await this.pool.query(
            `INSERT INTO user_profiles (uid, display_name, timezone, created_at, updated_at)
            VALUES ($1, $2, $3, now(), now())`,
            [uid, displayName, timezone]
        );
    }

    async findByUid(uid) {
        const { rows } = await this.pool.query(
            `SELECT * FROM user_profiles WHERE uid = $1`,
            [uid]
        );
        return rows[0] || null;
    }

    async update(uid, updates) {
        const fields = [];
        const values = [];
        let i = 1;

        for (const key in updates) {
            fields.push(`${key} = $${i++}`);
            values.push(updates[key]);
        }

        if (!fields.length) return;

        values.push(uid);

        await this.pool.query(
            `UPDATE user_profiles
            SET ${fields.join(', ')}, updated_at = now()
            WHERE uid = $${i}`,
            values
        );
    }

    async getPublicProfilesByUids(uids) {
        if (!uids.length) return [];

        const result = await this.pool.query(
            `
        SELECT uid, display_name, timezone
        FROM user_profiles
        WHERE uid = ANY($1::int[])
        `,
            [uids]
        );

        return result.rows;
    }

    async searchPublicProfiles(query, { limit = 20, offset = 0 } = {}) {
        const sql = `
        SELECT
        p.uid,
        p.display_name,
        p.avatar_media_id,
        p.timezone
        FROM user_profiles p
        JOIN user_preferences pref ON pref.uid = p.uid
        WHERE (
        p.display_name ILIKE '%' || $1 || '%'
        OR p.uid = COALESCE($2::int, -1)
        )
        AND (
            p.display_name ILIKE '%' || $1 || '%'
            OR p.uid = COALESCE($2::int, -1)
        )
        ORDER BY
        CASE WHEN p.display_name ILIKE $1 || '%' THEN 0 ELSE 1 END,
        p.created_at DESC
        LIMIT $3 OFFSET $4
    `;

        const numeric = /^[0-9]+$/.test(query) ? parseInt(query, 10) : null;

        const res = await this.pool.query(sql, [query, numeric, limit, offset]);
        return res.rows;
    }




}

module.exports = PgUserProfileRepository;
