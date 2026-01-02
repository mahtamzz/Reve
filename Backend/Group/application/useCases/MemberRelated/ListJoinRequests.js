class ListJoinRequests {
    constructor(groupMemberRepo, joinRequestRepo) {
        this.groupMemberRepo = groupMemberRepo;
        this.joinRequestRepo = joinRequestRepo;
    }

    async execute({ actorUid, groupId }) {
        const actorRole = await this.groupMemberRepo.getRole(groupId, actorUid);
        if (!actorRole) throw new Error("Not a member");

        if (actorRole !== "owner" && actorRole !== "admin") {
            throw new Error("Insufficient permissions");
        }

        const requests = await this.joinRequestRepo.listByGroup(groupId);

        return {
            groupId,
            total: requests.length,
            items: requests
        };
    }
}

module.exports = ListJoinRequests;
