class LeaveGroup {
    constructor(membershipRepo, groupRepo) {
        this.membershipRepo = membershipRepo;
        this.groupRepo = groupRepo;
    }

    async execute({ uid, groupId }) {
        const role = await this.membershipRepo.getRole(groupId, uid);
        if (!role) throw new Error('Not a member');

        if (role === 'owner') {
            throw new Error('Owner must transfer ownership before leaving');
        }

        await this.membershipRepo.removeMember(groupId, uid);
    }
}

module.exports = LeaveGroup;
