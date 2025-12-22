const UserPreferencesRepository = require('../../domain/repositories/PreferencesRepo');

class PgUserPreferencesRepository extends UserPreferencesRepository {
    constructor({ pool }) {
        super();
        this.pool = pool;
    }

    async findByUid(uid) {
        const { rows } = await this.pool.query(
            `SELECT * FROM user_preferences WHERE uid = $1`,
            [uid]
        );
        return rows[0] || null;
    }

    async upsert(uid, prefs) {
        await this.pool.query(
            `INSERT INTO user_preferences (uid, is_subject_public)
             VALUES ($1, $2)
             ON CONFLICT (uid)
             DO UPDATE SET
             is_subject_public = EXCLUDED.is_subject_public,
             updated_at = now()`,
            [uid, prefs.is_subject_public]
        );
    }
}

module.exports = PgUserPreferencesRepository;
