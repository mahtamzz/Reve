class JoinGroup {
    constructor(groupRepo, groupMemberRepo, joinRequestRepo, banRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.joinRequestRepo = joinRequestRepo;
        this.banRepo = banRepo;
    }

    async execute({ uid, groupId }) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new Error('Group not found');

        const banned = await this.banRepo.isBanned(groupId, uid);
        if (banned) throw new Error('You are banned from this group');

        const existing = await this.groupMemberRepo.find(uid, groupId);
        if (existing) throw new Error('Already a member');

        if (group.visibility === 'public') {
            await this.groupMemberRepo.add({
                uid,
                groupId,
                role: 'member'
            });
            return { status: 'joined' };
        }

        if (group.visibility === 'private') {
            await this.joinRequestRepo.create(groupId, uid);
            return { status: 'requested' };
        }

        throw new Error('Invite-only group');
    }
}

module.exports = JoinGroup;
