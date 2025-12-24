const SubjectRepo = require('../../domain/repositories/SubjectRepo');

class PgSubjectRepo extends SubjectRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async create(ownerUid, name, color = null) {
        const result = await this.db.query(
            `
    INSERT INTO subjects (owner_uid, name, color)
    VALUES ($1, $2, $3)
    ON CONFLICT (owner_uid, name) DO NOTHING
    RETURNING *
    `,
            [ownerUid, name, color]
        );

        return result.rows[0] || null;
    }


    async findById(subjectId, ownerUid) {
        const result = await this.db.query(
            `
            SELECT *
            FROM subjects
            WHERE id = $1 AND owner_uid = $2
            `,
            [subjectId, ownerUid]
        );

        return result.rows[0] || null;
    }

    async listByOwner(ownerUid) {
        const result = await this.db.query(
            `
            SELECT *
            FROM subjects
            WHERE owner_uid = $1
            ORDER BY created_at DESC
            `,
            [ownerUid]
        );

        return result.rows;
    }

    async update(subjectId, ownerUid, fields) {
        const allowed = ['name', 'color'];

        const filtered = Object.fromEntries(
            Object.entries(fields).filter(([k]) => allowed.includes(k))
        );

        if (Object.keys(filtered).length === 0) {
            return this.findById(subjectId, ownerUid);
        }

        const keys = Object.keys(filtered);
        const values = Object.values(filtered);

        const setClause = keys
            .map((k, i) => `${k} = $${i + 3}`)
            .join(', ');

        const result = await this.db.query(
            `
            UPDATE subjects
            SET ${setClause}
            WHERE id = $1 AND owner_uid = $2
            RETURNING *
            `,
            [subjectId, ownerUid, ...values]
        );

        return result.rows[0] || null;
    }

    async delete(subjectId, ownerUid) {
        const result = await this.db.query(
            `
            DELETE FROM subjects
            WHERE id = $1 AND owner_uid = $2
            `,
            [subjectId, ownerUid]
        );

        return result.rowCount > 0;
    }
}

module.exports = PgSubjectRepo;
