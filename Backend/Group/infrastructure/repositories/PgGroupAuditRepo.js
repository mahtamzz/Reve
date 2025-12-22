const GroupAuditRepository = require('../../domain/repositories/GroupAuditRepository');

class PgGroupAuditRepository extends GroupAuditRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async log({ groupId, actorUid, action, targetUid, metadata }) {
        await this.db.query(
            `
            INSERT INTO group_audit_log
            (group_id, actor_uid, action, target_uid, metadata)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [groupId, actorUid, action, targetUid || null, metadata || null]
        );
    }
}

module.exports = PgGroupAuditRepository;
