const pool = require('../db/postgres');
const UserPreferencesRepository = require('../../domain/repositories/PreferencesRepo');

class PgUserPreferencesRepository extends UserPreferencesRepository {
    async findByUid(uid) {
        const { rows } = await pool.query(
            `SELECT * FROM user_preferences WHERE uid = $1`,
            [uid]
        );
        return rows[0] || null;
    }

    async upsert(uid, prefs) {
        await pool.query(
            `INSERT INTO user_preferences (uid, is_profile_public, show_streak)
             VALUES ($1, $2, $3)
             ON CONFLICT (uid)
             DO UPDATE SET
                is_profile_public = EXCLUDED.is_profile_public,
                show_streak = EXCLUDED.show_streak,
                updated_at = now()`,
            [uid, prefs.isProfilePublic, prefs.showStreak]
        );
    }
}

module.exports = new PgUserPreferencesRepository();
