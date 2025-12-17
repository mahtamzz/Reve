const pool = require('../db/postgres');
const UserProfileRepository = require('../../domain/repositories/UserProfileRepo');

class PgUserProfileRepository extends UserProfileRepository {
    async create({ uid, displayName, timezone }) {
        await pool.query(
            `INSERT INTO user_profiles (uid, display_name, timezone)
            VALUES ($1, $2, $3)`,
            [uid, displayName, timezone]
        );
    }

    async findByUid(uid) {
        const { rows } = await pool.query(
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

        await pool.query(
            `UPDATE user_profiles
            SET ${fields.join(', ')}, updated_at = now()
            WHERE uid = $${i}`,
            values
        );
    }

    async incrementXp(uid, amount) {
        await pool.query(
            `UPDATE user_profiles
            SET xp = xp + $1, updated_at = now()
            WHERE uid = $2`,
            [amount, uid]
        );
    }

    async updateStreak(uid, streak) {
        await pool.query(
            `UPDATE user_profiles
            SET streak = $1, updated_at = now()
            WHERE uid = $2`,
            [streak, uid]
        );
    }
}

module.exports = new PgUserProfileRepository();
