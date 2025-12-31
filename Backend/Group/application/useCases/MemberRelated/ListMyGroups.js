class ListMyGroups {
    constructor(groupMemberRepo) {
        this.groupMemberRepo = groupMemberRepo;
    }

    async execute(uid) {
        if (!uid) throw new Error("uid is required");
        return this.groupMemberRepo.getUserGroups(uid);
    }
}

module.exports = ListMyGroups;
