class SendGroupMessage {
    constructor({ messageRepo }) {
        this.messageRepo = messageRepo;
    }

    async execute({ groupId, senderUid, text, clientMessageId = null }) {
        if (!groupId) throw new Error("groupId is required");
        if (!senderUid) throw new Error("senderUid is required");
        if (typeof text !== "string") throw new Error("text must be a string");

        const trimmed = text.trim();
        if (!trimmed) throw new Error("text is empty");
        if (trimmed.length > 2000) throw new Error("text too long");

        try {
            return await this.messageRepo.create({
                groupId,
                senderUid,
                text: trimmed,
                clientMessageId
            });
        } catch (e) {
            if (e && e.code === "23505" && clientMessageId) {
                const existing = await this.messageRepo.findByClientMessageId({
                    groupId,
                    senderUid,
                    clientMessageId
                });
                if (existing) return existing;
            }
            throw e;
        }
    }
}

module.exports = SendGroupMessage;
