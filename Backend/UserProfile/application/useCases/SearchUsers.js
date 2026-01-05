class SearchUsers {
    constructor(profileRepo) {
        this.profileRepo = profileRepo;
    }

    async execute({ q, limit = 20, offset = 0 }) {
        const query = (q ?? "").trim();

        if (!query) {
            return { items: [], paging: { limit, offset } };
        }

        // clamp paging
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

        const items = await this.profileRepo.searchPublicProfiles(query, {
            limit: safeLimit,
            offset: safeOffset
        });

        return { items, paging: { limit: safeLimit, offset: safeOffset } };
    }
}

module.exports = SearchUsers;
