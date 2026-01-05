class GetGroupDetails {
    constructor(groupRepo, groupMemberRepo) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
    }

    async execute({ actor, groupId }) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (actor.role === "admin") {
            return { group, membership: null };
        }

        // user rules
        if (group.visibility !== "public") {
            const role = await this.groupMemberRepo.getRole(groupId, actor.uid);
            if (!role) throw new Error("Not a member");
            return { group, membership: { role } };
        }

        const role = await this.groupMemberRepo.getRole(groupId, actor.uid);
        return { group, membership: role ? { role } : null };
    }
}

module.exports = GetGroupDetails;
