class ProcessedEventRepository {
    has(eventId) { throw new Error('Not implemented'); }
    markProcessed({ eventId, eventType }) { throw new Error('Not implemented'); }
}

module.exports = ProcessedEventRepository;
