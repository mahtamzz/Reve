const GroupRepository = require('../../domain/repositories/GroupRepository');

const DISCOVERABLE_FIELDS = `
    g.id,
    g.name,
    g.description,
    g.visibility,
    g.weekly_xp,
    g.minimum_dst_mins,
    g.owner_uid,
    g.created_at,
    g.updated_at
`;
class PgGroupRepository extends GroupRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async create({
        name,
        description,
        visibility = 'public',
        weeklyXp = 0,
        minimumDstMins = null,
        ownerUid
    }) {
        const result = await this.db.query(
            `
            INSERT INTO groups (
                name,
                description,
                visibility,
                weekly_xp,
                minimum_dst_mins,
                owner_uid
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
                name,
                description,
                visibility,
                weeklyXp,
                minimumDstMins,
                ownerUid
            ]
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
        // 🔒 whitelist allowed fields
        const allowed = [
            'name',
            'description',
            'visibility',
            'weekly_xp',
            'minimum_dst_mins'
        ];

        const filtered = Object.fromEntries(
            Object.entries(fields).filter(([k]) => allowed.includes(k))
        );

        if (Object.keys(filtered).length === 0) {
            return this.findById(groupId);
        }

        const keys = Object.keys(filtered);
        const values = Object.values(filtered);

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

    async listDiscoverable({ limit = 20, offset = 0 }) {
        const result = await this.db.query(
            `
            SELECT ${DISCOVERABLE_FIELDS}
            FROM groups g
            ORDER BY g.created_at DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );
        return result.rows;
    }

    async searchDiscoverable({ q, limit = 20, offset = 0 }) {
        // FTS version (if you added search_vector)
        const result = await this.db.query(
            `
            SELECT ${DISCOVERABLE_FIELDS}
            FROM groups g
            WHERE g.search_vector @@ websearch_to_tsquery('simple', $1)
            ORDER BY g.created_at DESC
            LIMIT $2 OFFSET $3
            `,
            [q, limit, offset]
        );
        return result.rows;
    }

    async listAll({ limit = 20, offset = 0 }) {
        const result = await this.db.query(
            `
            SELECT ${DISCOVERABLE_FIELDS}
            FROM groups g
            ORDER BY g.created_at DESC
            LIMIT $1 OFFSET $2
            `,
            [limit, offset]
        );
        return result.rows;
    }

}

module.exports = PgGroupRepository;
