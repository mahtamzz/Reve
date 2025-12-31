class ListGroupMessages {
    constructor({ messageRepo }) {
        this.messageRepo = messageRepo;
    }

    async execute({ groupId, uid, limit = 50, before = null }) {
        if (!groupId) throw new Error("groupId is required");
        if (!uid) throw new Error("uid is required");

        return this.messageRepo.listByGroup({ groupId, limit, before });
    }
}

module.exports = ListGroupMessages;
