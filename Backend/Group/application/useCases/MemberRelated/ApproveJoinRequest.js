class ApproveJoinRequest {
    constructor(groupMemberRepo, joinRequestRepo, auditRepo, eventBus) {
        this.groupMemberRepo = groupMemberRepo;
        this.joinRequestRepo = joinRequestRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ actorUid, targetUid, groupId }) {
        const actorRole = await this.groupMemberRepo.getRole(groupId, actorUid);
        if (!actorRole) throw new Error("Not a member");

        if (actorRole !== "owner" && actorRole !== "admin") {
            throw new Error("Insufficient permissions");
        }

        const request = await this.joinRequestRepo.find(groupId, targetUid);
        if (!request) throw new Error("Join request not found");

        await this.groupMemberRepo.addMember(groupId, targetUid, "member");
        await this.joinRequestRepo.delete(groupId, targetUid);

        await this.auditRepo.log({
            groupId,
            actorUid,
            action: "join_request.approved",
            targetUid
        });

        // 🔥 publish membership addition
        await this.eventBus.publish("group.member.added", {
            groupId,
            uid: parseInt(targetUid, 10), // ensure int
            at: new Date().toISOString(),
            reason: "approved"
        });
    }
}

module.exports = ApproveJoinRequest;
