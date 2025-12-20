const UserProfileAuditRepository = require('../../domain/repositories/AuditRepo');

class PgUserProfileAuditRepository extends UserProfileAuditRepository {
    constructor({ pool }) {
        super();
        this.pool = pool;
    }

    async log(uid, action, details = {}) {
        await this.pool.query(
            `INSERT INTO user_profile_audit_log (uid, action, details)
            VALUES ($1, $2, $3)`,
            [uid, action, details]
        );
    }
}

module.exports = PgUserProfileAuditRepository;
