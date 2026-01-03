class ListFollowing {
    constructor(followRepo, profileRepo) {
        this.followRepo = followRepo;
        this.profileRepo = profileRepo;
    }

    async execute({ uid, limit = 50, offset = 0, includeProfiles = true }) {
        if (!uid) throw new Error("missing uid");

        const followeeUids = await this.followRepo.listFollowing(uid, { limit, offset });

        if (!includeProfiles) {
            return { items: followeeUids, paging: { limit, offset } };
        }

        const profiles = await this.profileRepo.getPublicProfilesByUids(followeeUids);

        const byUid = new Map(profiles.map(p => [p.uid, p]));
        const items = followeeUids.map(id => byUid.get(id)).filter(Boolean);

        return { items, paging: { limit, offset } };
    }
}

module.exports = ListFollowing;
