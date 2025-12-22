class CreateGroup {
    constructor({ groupRepo, membershipRepo, auditRepo }) {
        this.groupRepo = groupRepo;
        this.membershipRepo = membershipRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, name, description, weeklyXp, minimumDst }) {
        const group = await this.groupRepo.create({
            name,
            description,
            weeklyXp,
            minimumDst,
            adminUid: uid
        });

        await this.membershipRepo.add({
            uid,
            groupId: group.id,
            role: 'admin'
        });

        await this.auditRepo.log(uid, 'GROUP_CREATED', {
            groupId: group.id
        });

        return group;
    }
}

module.exports = CreateGroup;
