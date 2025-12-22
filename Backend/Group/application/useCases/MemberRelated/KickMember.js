class KickMember {
    constructor(groupMemberRepo, auditRepo) {
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ actorUid, targetUid, groupId }) {
        const actor = await this.groupMemberRepo.find(actorUid, groupId);
        if (!actor) throw new Error('Not a member');

        if (actor.role !== 'owner' && actor.role !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        const target = await this.groupMemberRepo.find(targetUid, groupId);
        if (!target) throw new Error('Target not a member');

        if (target.role === 'owner') {
            throw new Error('Cannot kick owner');
        }

        if (actor.role === 'admin' && target.role === 'admin') {
            throw new Error('Admin cannot kick another admin');
        }

        await this.groupMemberRepo.remove(targetUid, groupId);

        await this.auditRepo.log({
            groupId,
            actorUid,
            action: 'member.kicked',
            targetUid
        });
    }
}

module.exports = KickMember;
