class AdminListGroups {
    constructor(groupRepo) {
        this.groupRepo = groupRepo;
    }

    async execute({ limit, offset }) {
        return this.groupRepo.listAll({ limit, offset });
    }
}

module.exports = AdminListGroups;
