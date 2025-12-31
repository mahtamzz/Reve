class KickMember {
    constructor(groupMemberRepo, auditRepo, eventBus) {
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ actorUid, targetUid, groupId }) {
        const actorRole = await this.groupMemberRepo.getRole(groupId, actorUid);
        if (!actorRole) throw new Error("Not a member");

        if (actorRole !== "owner" && actorRole !== "admin") {
            throw new Error("Insufficient permissions");
        }

        const targetRole = await this.groupMemberRepo.getRole(groupId, targetUid);
        if (!targetRole) throw new Error("Target not a member");

        if (targetRole === "owner") throw new Error("Cannot kick owner");
        if (actorRole === "admin" && targetRole === "admin") {
            throw new Error("Admin cannot kick another admin");
        }

        await this.groupMemberRepo.removeMember(groupId, targetUid);

        await this.auditRepo.log({
            groupId,
            actorUid,
            action: "member.kicked",
            targetUid
        });

        // 🔥 publish membership removal
        await this.eventBus.publish("group.member.removed", {
            groupId,
            uid: parseInt(targetUid, 10),
            at: new Date().toISOString(),
            reason: "kicked"
        });
    }
}

module.exports = KickMember;
