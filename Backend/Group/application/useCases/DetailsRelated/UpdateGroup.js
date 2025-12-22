class UpdateGroup {
    constructor(groupRepo, groupMemberRepo, auditRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, groupId, fields }) {
        const membership = await this.groupMemberRepo.find(uid, groupId);
        if (!membership) throw new Error('Not a member');

        if (membership.role !== 'owner' && membership.role !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        const updated = await this.groupRepo.update(groupId, fields);

        await this.auditRepo.log({
            groupId,
            actorUid: uid,
            action: 'group.updated',
            metadata: { fields }
        });

        return updated;
    }
}

module.exports = UpdateGroup;
