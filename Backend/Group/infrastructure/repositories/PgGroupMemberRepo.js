const GroupMemberRepository = require('../../domain/repositories/GroupMemberRepository');

class PgGroupMemberRepository extends GroupMemberRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async addMember(groupId, uid, role = 'member') {
        await this.db.query(
            `
            INSERT INTO group_members (group_id, uid, role)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            `,
            [groupId, uid, role]
        );
    }

    async removeMember(groupId, uid) {
        await this.db.query(
            `
            DELETE FROM group_members
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );
    }

    async getMembers(groupId) {
        const result = await this.db.query(
            `
            SELECT uid, role, joined_at
            FROM group_members
            WHERE group_id = $1
            `,
            [groupId]
        );
        return result.rows;
    }

    async getUserGroups(uid) {
        const result = await this.db.query(
            `
            SELECT g.*
            FROM groups g
            JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.uid = $1
            `,
            [uid]
        );
        return result.rows;
    }

    async getRole(groupId, uid) {
        const result = await this.db.query(
            `
            SELECT role
            FROM group_members
            WHERE group_id = $1 AND uid = $2
            `,
            [groupId, uid]
        );
        return result.rows[0]?.role || null;
    }

    async updateRole(groupId, uid, role) {
        const result = await this.db.query(
            `UPDATE group_members
            SET role = $3
            WHERE group_id = $1 AND uid = $2
            RETURNING uid, role, joined_at`,
            [groupId, uid, role]
        );
        return result.rows[0] || null;
    }

}

module.exports = PgGroupMemberRepository;
