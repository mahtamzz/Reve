const UserProfileAuditRepository = require('../../domain/repositories/AuditRepo');

class PgUserProfileAuditRepository extends UserProfileAuditRepository {
    constructor({ pool }) {
        super();
        this.pool = pool;
    }

    async log({ actorUid, action, metadata = {} }) {
        if (!action) {
            console.warn('Audit log skipped: action is missing');
            return; // skip logging instead of failing
        }

        await this.pool.query(
            `INSERT INTO user_profile_audit_log (uid, action, details)
             VALUES ($1, $2, $3)`,
            [actorUid, action, metadata]
        );
    }
}

module.exports = PgUserProfileAuditRepository;


