const StudySessionRepo = require('../../domain/repositories/StudySessionRepo');

class PgStudySessionRepo extends StudySessionRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async create(uid, subjectId, startedAt, durationMins) {
        if (!uid) throw new Error('uid is required');
        if (!subjectId) throw new Error('subjectId is required');
        if (!Number.isInteger(durationMins) || durationMins <= 0) {
            throw new Error('durationMins must be a positive integer');
        }

        const result = await this.db.query(
            `
      INSERT INTO study_sessions (uid, subject_id, started_at, duration_mins)
      VALUES ($1, $2, COALESCE($3::timestamptz, now()), $4)
      RETURNING *
      `,
            [uid, subjectId, startedAt, durationMins]
        );

        return result.rows[0];
    }

    async findById(sessionId) {
        const result = await this.db.query(
            `SELECT * FROM study_sessions WHERE id = $1`,
            [sessionId]
        );
        return result.rows[0] || null;
    }

    async listByUser(uid, opts = {}) {
        const { from = null, to = null, limit = 50, offset = 0 } = opts;

        const result = await this.db.query(
            `
      SELECT *
      FROM study_sessions
      WHERE uid = $1
        AND ($2::timestamptz IS NULL OR started_at >= $2::timestamptz)
        AND ($3::timestamptz IS NULL OR started_at <  $3::timestamptz)
      ORDER BY started_at DESC
      LIMIT $4 OFFSET $5
      `,
            [uid, from, to, limit, offset]
        );

        return result.rows;
    }

    async delete(sessionId, uid) {
        const result = await this.db.query(
            `DELETE FROM study_sessions WHERE id = $1 AND uid = $2`,
            [sessionId, uid]
        );
        return result.rowCount > 0;
    }
}

module.exports = PgStudySessionRepo;
