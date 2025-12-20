const UserDailyStudyRepository = require('../../domain/repositories/UserDSTRepo');

class PgUserDailyStudyRepository extends UserDailyStudyRepository {
    constructor({ pool }) {
        super();
        this.pool = pool;
    }

    async upsert(uid, studyDate, minutes) {
        await this.pool.query(
            `INSERT INTO user_daily_study (uid, study_date, total_duration_minutes)
            VALUES ($1, $2, $3)
            ON CONFLICT (uid, study_date)
            DO UPDATE SET total_duration_minutes =
            user_daily_study.total_duration_minutes + EXCLUDED.total_duration_minutes`,
            [uid, studyDate, minutes]
        );
    }

    async findByUidAndDate(uid, date) {
        const { rows } = await this.pool.query(
            `SELECT * FROM user_daily_study
            WHERE uid = $1 AND study_date = $2`,
            [uid, date]
        );
        return rows[0] || null;
    }

    async findRange(uid, from, to) {
        const { rows } = await this.pool.query(
            `SELECT * FROM user_daily_study
            WHERE uid = $1 AND study_date BETWEEN $2 AND $3
            ORDER BY study_date`,
            [uid, from, to]
        );
        return rows;
    }
}

module.exports = PgUserDailyStudyRepository;
