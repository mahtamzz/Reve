const db = require('../db/postgres'); // your PG client

class AuditRepository {
    async log({ user_id, action, entity, entity_id, details, ip_address, user_agent }) {
        const query = `
            INSERT INTO Audit_Log (user_id, action, entity, entity_id, details, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await db.query(query, [
            user_id,
            action,
            entity || null,
            entity_id || null,
            details ? JSON.stringify(details) : null,
            ip_address || null,
            user_agent || null
        ]);
    }
}

module.exports = new AuditRepository();
