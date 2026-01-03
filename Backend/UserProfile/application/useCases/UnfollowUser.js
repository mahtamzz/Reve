class UnfollowUser {
    constructor(followRepo, auditRepo, eventBus = null) {
        this.followRepo = followRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ followerUid, followeeUid }, meta = {}) {
        if (!followerUid || !followeeUid) {
            throw new Error("missing followerUid or followeeUid");
        }
        if (followerUid === followeeUid) {
            throw new Error("cannot unfollow yourself");
        }

        // Idempotent: deleting a non-existing relation should be ok
        const deleted = await this.followRepo.delete(followerUid, followeeUid);

        await this.auditRepo.log(followerUid, "USER_UNFOLLOWED", {
            followeeUid,
            deleted: Boolean(deleted),
            source: meta.source ?? "http",
            requestId: meta.requestId ?? null
        });

        if (this.eventBus) {
            await this.eventBus.publish("user.unfollowed", {
                followerUid,
                followeeUid,
                occurredAt: new Date().toISOString()
            });
        }

        return { status: deleted ? "unfollowed" : "skipped", reason: deleted ? null : "not_following" };
    }
}

module.exports = UnfollowUser;
