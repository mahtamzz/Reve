class ChatMessageRepository {
    async create({ groupId, senderUid, text, clientMessageId = null }) {
        throw new Error("Not implemented");
    }

    async findById(messageId) {
        throw new Error("Not implemented");
    }

    async listByGroup({ groupId, limit = 50, before = null }) {
        throw new Error("Not implemented");
    }

    async findByClientMessageId({ groupId, senderUid, clientMessageId }) {
        throw new Error("Not implemented");
    }

    // ✅ NEW
    async listLatestByGroupIds(groupIds) {
        throw new Error("Not implemented");
    }
}

module.exports = ChatMessageRepository;
