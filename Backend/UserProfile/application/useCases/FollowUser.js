class FollowUser {
    constructor(followRepo, profileRepo, auditRepo, eventBus = null) {
        this.followRepo = followRepo;
        this.profileRepo = profileRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ followerUid, followeeUid }, meta = {}) {
        if (!followerUid || !followeeUid) {
            throw new Error("missing followerUid or followeeUid");
        }
        if (followerUid === followeeUid) {
            throw new Error("cannot follow yourself");
        }

        // Ensure followee exists (avoid dangling follow rows)
        const followee = await this.profileRepo.findByUid(followeeUid);
        if (!followee) {
            const err = new Error("followee not found");
            err.code = "FOLLOWEE_NOT_FOUND";
            throw err;
        }

        // Idempotent: if already following, return ok
        const already = await this.followRepo.exists(followerUid, followeeUid);
        if (already) {
            return { status: "skipped", reason: "already_following" };
        }

        await this.followRepo.create({ followerUid, followeeUid });

        await this.auditRepo.log(followerUid, "USER_FOLLOWED", {
            followeeUid,
            source: meta.source ?? "http",
            requestId: meta.requestId ?? null
        });

        if (this.eventBus) {
            await this.eventBus.publish("user.followed", {
                followerUid,
                followeeUid,
                occurredAt: new Date().toISOString()
            });
        }

        return { status: "followed" };
    }
}

module.exports = FollowUser;
