class ListGroups {
    constructor(groupRepo) {
        this.groupRepo = groupRepo;
    }

    async execute({ viewerUid, limit, offset }) {
        return this.groupRepo.listDiscoverable({ viewerUid, limit, offset });
    }
}

module.exports = ListGroups;
