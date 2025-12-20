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

    async incrementXp(uid, amount) {
        await this.pool.query(
            `UPDATE user_profiles
             SET xp = xp + $1, updated_at = now()
             WHERE uid = $2`,
            [amount, uid]
        );
    }

    async updateStreak(uid, streak) {
        await this.pool.query(
            `UPDATE user_profiles
             SET streak = $1, updated_at = now()
             WHERE uid = $2`,
            [streak, uid]
        );
    }
}

module.exports = PgUserProfileRepository;
