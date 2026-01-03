class PgFollowRepo {
    constructor({ pool }) {
        this.pool = pool;
    }

    async create({ followerUid, followeeUid }) {
        // idempotent insert
        const q = `
      INSERT INTO user_follows (follower_uid, followee_uid)
      VALUES ($1, $2)
      ON CONFLICT (follower_uid, followee_uid) DO NOTHING
    `;
        const res = await this.pool.query(q, [followerUid, followeeUid]);
        return res.rowCount > 0;
    }

    async delete(followerUid, followeeUid) {
        const q = `
      DELETE FROM user_follows
      WHERE follower_uid = $1 AND followee_uid = $2
    `;
        const res = await this.pool.query(q, [followerUid, followeeUid]);
        return res.rowCount > 0;
    }

    async exists(followerUid, followeeUid) {
        const q = `
      SELECT 1
      FROM user_follows
      WHERE follower_uid = $1 AND followee_uid = $2
      LIMIT 1
    `;
        const res = await this.pool.query(q, [followerUid, followeeUid]);
        return res.rows.length > 0;
    }

    async listFollowers(uid, { limit = 50, offset = 0 } = {}) {
        const q = `
      SELECT follower_uid
      FROM user_follows
      WHERE followee_uid = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const res = await this.pool.query(q, [uid, limit, offset]);
        return res.rows.map(r => r.follower_uid);
    }

    async listFollowing(uid, { limit = 50, offset = 0 } = {}) {
        const q = `
      SELECT followee_uid
      FROM user_follows
      WHERE follower_uid = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const res = await this.pool.query(q, [uid, limit, offset]);
        return res.rows.map(r => r.followee_uid);
    }

    async countFollowers(uid) {
        const q = `
      SELECT COUNT(*)::int AS n
      FROM user_follows
      WHERE followee_uid = $1
    `;
        const res = await this.pool.query(q, [uid]);
        return res.rows[0]?.n ?? 0;
    }

    async countFollowing(uid) {
        const q = `
      SELECT COUNT(*)::int AS n
      FROM user_follows
      WHERE follower_uid = $1
    `;
        const res = await this.pool.query(q, [uid]);
        return res.rows[0]?.n ?? 0;
    }
}

module.exports = PgFollowRepo;
