class GetFollowCounts {
    constructor(followRepo) {
        this.followRepo = followRepo;
    }

    async execute({ uid }) {
        if (!uid) throw new Error("missing uid");

        const [followers, following] = await Promise.all([
            this.followRepo.countFollowers(uid),
            this.followRepo.countFollowing(uid)
        ]);

        return { uid, followers, following };
    }
}

module.exports = GetFollowCounts;
