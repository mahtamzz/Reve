class CreateGroup {
    constructor({ groupRepo, membershipRepo, auditRepo }) {
        this.groupRepo = groupRepo;
        this.membershipRepo = membershipRepo;
        this.auditRepo = auditRepo;
    }

    async execute({
        uid,
        name,
        description,
        visibility,
        weeklyXp,
        minimumDstMins
    }) {
        const group = await this.groupRepo.create({
            name,
            description,
            visibility,
            weeklyXp,
            minimumDstMins,
            ownerUid: uid
        });

        await this.membershipRepo.addMember(
            group.id,
            uid,
            'owner'
        );

        await this.auditRepo.log({
            groupId: group.id,
            actorUid: uid,
            action: 'group.created'
        });

        return group;
    }
}

module.exports = CreateGroup;
