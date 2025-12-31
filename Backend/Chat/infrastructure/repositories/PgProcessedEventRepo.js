const ProcessedEventRepository = require('../../domain/repositories/ProcessedEventRepository');

class PgProcessedEventRepo extends ProcessedEventRepository {
    constructor(db) {
        super();
        this.db = db;
    }

    async has(eventId) {
        const result = await this.db.query(
            `SELECT 1 FROM chat_processed_events WHERE event_id = $1 LIMIT 1`,
            [eventId]
        );
        return result.rowCount > 0;
    }

    async markProcessed({ eventId, eventType }) {
        await this.db.query(
            `
            INSERT INTO chat_processed_events (event_id, event_type)
            VALUES ($1, $2)
            ON CONFLICT (event_id) DO NOTHING
            `,
            [eventId, eventType]
        );
    }
}

module.exports = PgProcessedEventRepo;
