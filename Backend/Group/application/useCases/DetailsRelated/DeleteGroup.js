class DeleteGroup {
    constructor(groupRepo, groupMemberRepo, auditRepo, eventBus) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ actor, groupId, reason = null }) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new Error("Group not found");

        const isPlatformAdmin = actor.role === "admin";
        const isOwner = actor.type === "user" && group.owner_uid === actor.uid;

        if (!isPlatformAdmin && !isOwner) {
            throw new Error("Insufficient permissions");
        }
        
        await this.auditRepo.log({
            groupId,
            actorUid: actor.uid ?? null,
            action: "group.deleted",
            targetUid: group.owner_uid,
            metadata: {
                platform_admin: isPlatformAdmin,
                admin_id: actor.adminId ?? null,
                reason
            }
        });

        await this.groupRepo.delete(groupId);

        await this.eventBus.publish("group.deleted", {
            groupId,
            at: new Date().toISOString(),
            by: isPlatformAdmin ? { type: "admin", adminId: actor.adminId } : { type: "user", uid: actor.uid }
        });
    }
}

module.exports = DeleteGroup;
