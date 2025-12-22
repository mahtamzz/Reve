class LeaveGroup {
    constructor(membershipRepo, groupRepo) {
        this.membershipRepo = membershipRepo;
        this.groupRepo = groupRepo;
    }

    async execute({ uid, groupId }) {
        const membership = await this.membershipRepo.find(uid, groupId);
        if (!membership) throw new Error('Not a member');

        if (membership.role === 'admin') {
            throw new Error('Admin must transfer ownership');
        }

        await this.membershipRepo.remove(uid, groupId);
    }
}

module.exports = LeaveGroup;