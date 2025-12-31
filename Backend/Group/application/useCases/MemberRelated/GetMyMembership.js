class GetMyMembership {
    constructor(groupMemberRepo) {
        this.groupMemberRepo = groupMemberRepo;
    }

    async execute({ groupId, uid }) {
        if (!groupId) throw new Error("groupId is required");
        if (!uid) throw new Error("uid is required");

        const role = await this.groupMemberRepo.getRole(groupId, uid);

        return {
            groupId,
            uid,
            isMember: Boolean(role),
            role: role || null
        };
    }
}

module.exports = GetMyMembership;
