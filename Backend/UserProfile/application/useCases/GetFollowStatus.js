class GetFollowStatus {
    constructor(followRepo) {
        this.followRepo = followRepo;
    }

    async execute({ followerUid, followeeUid }) {
        if (!followerUid || !followeeUid) {
            throw new Error("missing followerUid or followeeUid");
        }
        if (followerUid === followeeUid) {
            return { isFollowing: false };
        }

        const isFollowing = await this.followRepo.exists(followerUid, followeeUid);
        return { isFollowing };
    }
}

module.exports = GetFollowStatus;
