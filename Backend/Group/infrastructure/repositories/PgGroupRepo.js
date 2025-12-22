const GroupRepository = require('../../domain/repositories/GroupRepository');

class PgGroupRepository extends GroupRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async create({ name, description, visibility, ownerUid }) {
        const result = await this.db.query(
            `
            INSERT INTO groups (name, description, visibility, owner_uid)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [name, description, visibility, ownerUid]
        );
        return result.rows[0];
    }

    async findById(groupId) {
        const result = await this.db.query(
            `SELECT * FROM groups WHERE id = $1`,
            [groupId]
        );
        return result.rows[0];
    }

    async listByOwner(uid) {
        const result = await this.db.query(
            `SELECT * FROM groups WHERE owner_uid = $1`,
            [uid]
        );
        return result.rows;
    }

    async update(groupId, fields) {
        const keys = Object.keys(fields);
        const values = Object.values(fields);

        const setClause = keys
            .map((k, i) => `${k} = $${i + 2}`)
            .join(', ');

        const result = await this.db.query(
            `
            UPDATE groups
            SET ${setClause}, updated_at = now()
            WHERE id = $1
            RETURNING *
            `,
            [groupId, ...values]
        );

        return result.rows[0];
    }

    async delete(groupId) {
        await this.db.query(
            `DELETE FROM groups WHERE id = $1`,
            [groupId]
        );
    }
}

module.exports = PgGroupRepository;
