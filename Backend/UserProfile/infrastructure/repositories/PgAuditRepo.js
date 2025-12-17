const pool = require('../db/postgres');
const UserProfileAuditRepository = require('../../domain/repositories/AuditRepo');

class PgUserProfileAuditRepository extends UserProfileAuditRepository {
    async log(uid, action, details = {}) {
        await pool.query(
            `INSERT INTO user_profile_audit_log (uid, action, details)
             VALUES ($1, $2, $3)`,
            [uid, action, details]
        );
    }
}

module.exports = new PgUserProfileAuditRepository();
