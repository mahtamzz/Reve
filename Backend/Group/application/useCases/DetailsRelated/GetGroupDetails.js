class GetGroupDetails {
    constructor(groupRepo, groupMemberRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
    }

    async execute({ uid, groupId }) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new Error('Group not found');

        if (group.visibility !== 'public') {
            const membership = await this.groupMemberRepo.find(uid, groupId);
            if (!membership) {
                throw new Error('Access denied');
            }
        }

        const members = await this.groupMemberRepo.listByGroup(groupId);

        return { group, members };
    }
}

module.exports = GetGroupDetails;
