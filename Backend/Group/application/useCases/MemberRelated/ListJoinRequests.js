const canGroupAdminister = require("../../policies/canGroupAdminister");

class ListJoinRequests {
    constructor(groupMemberRepo, joinRequestRepo) {
        this.groupMemberRepo = groupMemberRepo;
        this.joinRequestRepo = joinRequestRepo;
    }

    async execute({ actor, groupId }) {
        let actorRole = null;

        if (actor.role !== "admin") {
            actorRole = await this.groupMemberRepo.getRole(groupId, actor.uid);
            if (!actorRole) throw new Error("Not a member");
        }

        if (!canGroupAdminister({ actor, actorRole })) {
            throw new Error("Insufficient permissions");
        }

        return this.joinRequestRepo.listByGroup(groupId);
    }
}

module.exports = ListJoinRequests;
