class SearchGroups {
    constructor(groupRepo) {
        this.groupRepo = groupRepo;
    }

    async execute({ viewerUid, q, limit, offset }) {
        if (!q || !q.trim()) return [];
        return this.groupRepo.searchDiscoverable({ viewerUid, q: q.trim(), limit, offset });
    }
}

module.exports = SearchGroups;
