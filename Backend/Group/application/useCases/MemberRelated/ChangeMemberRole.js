class ChangeMemberRole {
    constructor(groupMemberRepo, auditRepo) {
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ actorUid, targetUid, groupId, role }) {
        const actor = await this.groupMemberRepo.find(actorUid, groupId);
        if (!actor) throw new Error('Not a member');

        if (actor.role !== 'owner') {
            throw new Error('Only owner can change roles');
        }

        const target = await this.groupMemberRepo.find(targetUid, groupId);
        if (!target) throw new Error('Target not a member');

        if (target.role === 'owner') {
            throw new Error('Cannot change owner role');
        }

        await this.groupMemberRepo.updateRole(targetUid, groupId, role);

        await this.auditRepo.log({
            groupId,
            actorUid,
            action: 'member.role_changed',
            targetUid,
            metadata: { role }
        });
    }
}

module.exports = ChangeMemberRole;
