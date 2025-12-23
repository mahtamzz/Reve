class DeleteGroup {
    constructor(groupRepo, groupMemberRepo, auditRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, groupId }) {
        const role = await this.groupMemberRepo.getRole(groupId, uid);
        if (!role) throw new Error('Not a member');

        if (role !== 'owner') {
            throw new Error('Only owner can delete group');
        }
        await this.auditRepo.log({
            groupId,
            actorUid: uid,
            action: 'group.deleted'
        });

        await this.groupRepo.delete(groupId);

    }
}

module.exports = DeleteGroup;
