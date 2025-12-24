const StudyAuditRepo = require('../../domain/repositories/StudyAuditRepo');

class PgStudyAuditRepo extends StudyAuditRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async log({ uid, action, subjectId = null, metadata = null }) {
        await this.db.query(
            `
      INSERT INTO study_audit_log (uid, action, subject_id, metadata)
      VALUES ($1, $2, $3, $4)
      `,
            [uid, action, subjectId, metadata]
        );
    }

    async listByUser(uid, { limit = 50, offset = 0 } = {}) {
        const result = await this.db.query(
            `
      SELECT *
      FROM study_audit_log
      WHERE uid = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
            [uid, limit, offset]
        );
        return result.rows;
    }
}

module.exports = PgStudyAuditRepo;
