class CreateGroup {
    constructor({ groupRepo, membershipRepo, auditRepo, eventBus }) {
        this.groupRepo = groupRepo;
        this.membershipRepo = membershipRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ uid, name, description, visibility, weeklyXp, minimumDstMins }) {
        const group = await this.groupRepo.create({
            name,
            description,
            visibility,
            weeklyXp,
            minimumDstMins,
            ownerUid: uid
        });

        await this.membershipRepo.addMember(group.id, uid, "owner");

        await this.auditRepo.log({
            groupId: group.id,
            actorUid: uid,
            action: "group.created"
        });

        // 🔥 publish owner membership so Chat learns it
        await this.eventBus.publish("group.member.added", {
            groupId: group.id,
            uid,
            at: new Date().toISOString(),
            reason: "created"
        });

        return group;
    }
}

module.exports = CreateGroup;
