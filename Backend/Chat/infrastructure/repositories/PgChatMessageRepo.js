const ChatMessageRepository = require('../../domain/repositories/ChatMessageRepository');

class PgChatMessageRepo extends ChatMessageRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async create({ groupId, senderUid, text, clientMessageId = null }) {
        const result = await this.db.query(
            `
            INSERT INTO chat_messages (group_id, sender_uid, text, client_message_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [groupId, senderUid, text, clientMessageId]
        );
        return result.rows[0];
    }

    async findById(messageId) {
        const result = await this.db.query(
            `SELECT * FROM chat_messages WHERE id = $1`,
            [messageId]
        );
        return result.rows[0];
    }

    async listByGroup({ groupId, limit = 50, before = null }) {
        const result = await this.db.query(
            `
      SELECT *
      FROM chat_messages
      WHERE group_id = $1
        AND ($2::timestamptz IS NULL OR created_at < $2::timestamptz)
      ORDER BY created_at DESC
      LIMIT $3
      `,
            [groupId, before, limit]
        );
        return result.rows;
    }

    async findByClientMessageId({ groupId, senderUid, clientMessageId }) {
        const result = await this.db.query(
            `
      SELECT *
      FROM chat_messages
      WHERE group_id = $1 AND sender_uid = $2 AND client_message_id = $3
      LIMIT 1
      `,
            [groupId, senderUid, clientMessageId]
        );
        return result.rows[0];
    }
}

module.exports = PgChatMessageRepo;
