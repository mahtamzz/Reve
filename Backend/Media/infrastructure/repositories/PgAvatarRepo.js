const AvatarRepo = require('../../domain/repositories/AvatarRepo');

class PgAvatarRepo extends AvatarRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async upsert(uid, filePath, mimeType, sizeBytes) {
        if (!uid) throw new Error('uid is required');
        if (!filePath) throw new Error('filePath is required');
        if (!mimeType) throw new Error('mimeType is required');
        if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
            throw new Error('sizeBytes must be a positive integer');
        }

        const result = await this.db.query(
            `
      INSERT INTO user_avatars (uid, file_path, mime_type, size_bytes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid)
      DO UPDATE SET
        file_path = EXCLUDED.file_path,
        mime_type = EXCLUDED.mime_type,
        size_bytes = EXCLUDED.size_bytes,
        updated_at = now()
      RETURNING uid, file_path, mime_type, size_bytes, updated_at
      `,
            [uid, filePath, mimeType, sizeBytes]
        );

        return result.rows[0];
    }

    async findByUid(uid) {
        const result = await this.db.query(
            `
      SELECT uid, file_path, mime_type, size_bytes, updated_at
      FROM user_avatars
      WHERE uid = $1
      `,
            [uid]
        );

        return result.rows[0] || null;
    }

    async deleteByUid(uid) {
        const result = await this.db.query(
            `DELETE FROM user_avatars WHERE uid = $1`,
            [uid]
        );

        return result.rowCount > 0;
    }
}

module.exports = PgAvatarRepo;
