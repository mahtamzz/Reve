const SubjectDSTRepo = require('../../domain/repositories/SubjectDSTRepo');

class PgSubjectDSTRepo extends SubjectDSTRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async addMinutes(uid, day, subjectId, minutes) {
        if (!subjectId) {
            throw new Error('subjectId is required');
        }
        const result = await this.db.query(
            `
            INSERT INTO subject_DST (uid, day, subject_id, duration_mins)
            VALUES ($1, $2::date, $3, $4)
            ON CONFLICT (uid, day, subject_id)
            DO UPDATE SET
                duration_mins = subject_DST.duration_mins + EXCLUDED.duration_mins,
                updated_at = now()
            RETURNING *
            `,
            [uid, day, subjectId, minutes]
        );

        return result.rows[0];
    }

    async getByDay(uid, day) {
        const result = await this.db.query(
            `
            SELECT uid, day, subject_id, duration_mins, updated_at
            FROM subject_DST
            WHERE uid = $1 AND day = $2::date
            ORDER BY subject_id
            `,
            [uid, day]
        );

        return result.rows;
    }

    async getTotalByDay(uid, day) {
        const result = await this.db.query(
            `
            SELECT total_duration_mins
            FROM user_DST
            WHERE uid = $1 AND day = $2::date
            `,
            [uid, day]
        );

        return result.rows[0]?.total_duration_mins ?? 0;
    }

    async listTotals(uid, from, to) {
        const result = await this.db.query(
            `
            SELECT uid, day, total_duration_mins
            FROM user_DST
            WHERE uid = $1
                AND day >= $2::date
                AND day <= $3::date
            ORDER BY day ASC
            `,
            [uid, from, to]
        );

        return result.rows;
    }
}

module.exports = PgSubjectDSTRepo;
