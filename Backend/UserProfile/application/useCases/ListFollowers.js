class ListFollowers {
    constructor(followRepo, profileRepo) {
        this.followRepo = followRepo;
        this.profileRepo = profileRepo;
    }

    async execute({ uid, limit = 50, offset = 0, includeProfiles = true }) {
        if (!uid) throw new Error("missing uid");

        const followerUids = await this.followRepo.listFollowers(uid, { limit, offset });

        if (!includeProfiles) {
            return { items: followerUids, paging: { limit, offset } };
        }

        // Use existing repo method to fetch public data in batch
        const profiles = await this.profileRepo.getPublicProfilesByUids(followerUids);

        // Preserve original order
        const byUid = new Map(profiles.map(p => [p.uid, p]));
        const items = followerUids.map(id => byUid.get(id)).filter(Boolean);

        return { items, paging: { limit, offset } };
    }
}

module.exports = ListFollowers;
