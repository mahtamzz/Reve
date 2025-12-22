const GroupBanRepository = require('../../domain/repositories/GroupBanRepository');

class PgGroupBanRepository extends GroupBanRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async ban(groupId, uid, reason = null) {
        const result = await this.db.query(
            `
            INSERT INTO group_bans (group_id, uid, reason)
            VALUES ($1, $2, $3)
            ON CONFLICT (group_id, uid)
            DO UPDATE SET
                reason = EXCLUDED.reason,
                banned_at = now()
            RETURNING *
            `,
            [groupId, uid, reason]
        );

        return result.rows[0];
    }

    async isBanned(groupId, uid) {
        const result = await this.db.query(
            `
            SELECT 1
            FROM group_bans
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );

        return result.rowCount > 0;
    }

    async unban(groupId, uid) {
        await this.db.query(
            `
            DELETE FROM group_bans
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );
    }

    async listByGroup(groupId) {
        const result = await this.db.query(
            `
            SELECT *
            FROM group_bans
            WHERE group_id = $1
            ORDER BY banned_at DESC
            `,
            [groupId]
        );

        return result.rows;
    }
}

module.exports = PgGroupBanRepository;
