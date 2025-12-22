class DeleteGroup {
    constructor(groupRepo, groupMemberRepo, auditRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, groupId }) {
        const membership = await this.groupMemberRepo.find(uid, groupId);
        if (!membership) throw new Error('Not a member');

        if (membership.role !== 'owner') {
            throw new Error('Only owner can delete group');
        }

        await this.groupRepo.delete(groupId);

        await this.auditRepo.log({
            groupId,
            actorUid: uid,
            action: 'group.deleted'
        });
    }
}

module.exports = DeleteGroup;
