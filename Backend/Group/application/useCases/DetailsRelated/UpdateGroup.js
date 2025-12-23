class UpdateGroup {
    constructor(groupRepo, groupMemberRepo, auditRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, groupId, fields }) {
        const role = await this.groupMemberRepo.getRole(groupId, uid);
        if (!role) throw new Error('Not a member');

        if (role !== 'owner' && role !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        const mappedFields = { ...fields };

        if ('weeklyXp' in fields) {
            mappedFields.weekly_xp = fields.weeklyXp;
            delete mappedFields.weeklyXp;
        }

        if ('minimumDstMins' in fields) {
            mappedFields.minimum_dst_mins = fields.minimumDstMins;
            delete mappedFields.minimumDstMins;
        }

        const updated = await this.groupRepo.update(groupId, mappedFields);

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
