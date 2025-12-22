const GroupJoinRequestRepository = require('../../domain/repositories/GroupJoinRequestRepository');

class PgGroupJoinRequestRepository extends GroupJoinRequestRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async create(groupId, uid) {
        const result = await this.db.query(
            `
            INSERT INTO group_join_requests (group_id, uid)
            VALUES ($1, $2)
            ON CONFLICT (group_id, uid)
            DO NOTHING
            RETURNING *
            `,
            [groupId, uid]
        );

        return result.rows[0] || null;
    }

    async listByGroup(groupId) {
        const result = await this.db.query(
            `
            SELECT *
            FROM group_join_requests
            WHERE group_id = $1
            ORDER BY created_at ASC
            `,
            [groupId]
        );

        return result.rows;
    }

    async find(groupId, uid) {
        const result = await this.db.query(
            `
            SELECT *
            FROM group_join_requests
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );

        return result.rows[0];
    }

    async delete(groupId, uid) {
        await this.db.query(
            `
            DELETE FROM group_join_requests
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );
    }

    async deleteByGroup(groupId) {
        await this.db.query(
            `
            DELETE FROM group_join_requests
            WHERE group_id = $1
            `,
            [groupId]
        );
    }
}

module.exports = PgGroupJoinRequestRepository;
