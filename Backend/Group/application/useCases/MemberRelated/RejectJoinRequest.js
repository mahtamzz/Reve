class RejectJoinRequest {
    constructor(joinRequestRepo, groupMemberRepo, auditRepo) {
        this.joinRequestRepo = joinRequestRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ actorUid, targetUid, groupId }) {
        const actorRole = await this.groupMemberRepo.getRole(groupId, actorUid);
        if (!actorRole) throw new Error('Not a member');

        if (actorRole !== 'owner' && actorRole !== 'admin') {
            throw new Error('Insufficient permissions');
        }

        const request = await this.joinRequestRepo.find(groupId, targetUid);
        if (!request) throw new Error('Join request not found');

        await this.joinRequestRepo.delete(groupId, targetUid);

        await this.auditRepo.log({
            groupId,
            actorUid,
            action: 'join_request.rejected',
            targetUid
        });
    }
}

module.exports = RejectJoinRequest;
