class AuditRepositoryPg {
    constructor({ pool }) {
        this.pool = pool;
    }

    async log({
        user_id,
        action,
        entity,
        entity_id,
        details,
        ip_address,
        user_agent
    }) {
        await this.pool.query(
            `INSERT INTO audit_log
            (user_id, action, entity, entity_id, details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                user_id,
                action,
                entity || null,
                entity_id || null,
                details ? JSON.stringify(details) : null,
                ip_address || null,
                user_agent || null
            ]
        );
    }
}

module.exports = AuditRepositoryPg;
