class ChatMessageRepository {
    create(message) { throw new Error('Not implemented'); }
    findById(messageId) { throw new Error('Not implemented'); }

    // newest-first pagination
    listByGroup({ groupId, limit, before }) { throw new Error('Not implemented'); }

    // to support dedupe when unique constraint triggers
    findByClientMessageId({ groupId, senderUid, clientMessageId }) { throw new Error('Not implemented'); }
}

module.exports = ChatMessageRepository;
