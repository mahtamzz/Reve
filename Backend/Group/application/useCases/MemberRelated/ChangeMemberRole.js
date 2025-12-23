class ChangeMemberRole {
    constructor(groupMemberRepo, auditRepo) {
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ actorUid, targetUid, groupId, role }) {
        const actorRole = await this.groupMemberRepo.getRole(groupId, actorUid);
        if (!actorRole) throw new Error('Not a member');
        if (actorRole !== 'owner') throw new Error('Only owner can change roles');

        const targetRole = await this.groupMemberRepo.getRole(groupId, targetUid);
        if (!targetRole) throw new Error('Target not a member');
        if (targetRole === 'owner') throw new Error('Cannot change owner role');

        await this.groupMemberRepo.updateRole(groupId, targetUid, role);

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
