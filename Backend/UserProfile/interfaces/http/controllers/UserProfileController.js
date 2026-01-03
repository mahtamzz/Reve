class UserProfileController {
    constructor({
        getProfile,
        updateProfile,
        updatePreferences,
        getDashboard,
        iamClient,
        getPublicProfilesBatch,
        followUser,
        unfollowUser,
        listFollowers,
        listFollowing,
        getFollowStatus,
        getFollowCounts
    }) {
        this.getProfile = getProfile;
        this.updateProfile = updateProfile;
        this.updatePreferences = updatePreferences;
        this.getDashboard = getDashboard;
        this.iamClient = iamClient;
        this.getPublicProfilesBatch = getPublicProfilesBatch;
        this.followUser = followUser;
        this.unfollowUser = unfollowUser;
        this.listFollowers = listFollowers;
        this.listFollowing = listFollowing;
        this.getFollowStatus = getFollowStatus;
        this.getFollowCounts = getFollowCounts;
    }

    getMe = async (req, res) => {
        const uid = req.user.uid;
        const data = await this.getProfile.execute(uid);
        res.json(data);
    };

    updateProfileInfo = async (req, res) => {
        const uid = req.user.uid;
        await this.updateProfile.execute(uid, req.body);
        res.status(204).end();
    };

    updatePreferencesInfo = async (req, res) => {
        const uid = req.user.uid;
        await this.updatePreferences.execute(uid, req.body);
        res.status(204).end();
    };

    dashboard = async (req, res) => {
        const uid = req.user.uid;
        const data = await this.getDashboard.execute(uid);
        res.json(data);
    };

    changePassword = async (req, res) => {
        const authHeader = req.headers.authorization || "";
        const uid = req.user.uid; // not required if IAM uses token, but ok to have

        await this.iamClient.changePassword(authHeader, {
            current_password: req.body.current_password,
            new_password: req.body.new_password
        });
        res.status(204).end();
    };

    getPublicProfilesBatchHandler = async (req, res) => {
        const uids = Array.isArray(req.body.uids) ? req.body.uids : [];

        // basic sanity: ensure ints & dedupe
        const cleaned = [...new Set(uids.map(n => parseInt(n, 10)).filter(Number.isFinite))];

        const items = await this.getPublicProfilesBatch.execute({ uids: cleaned });

        res.json({ items });
    };

    follow = async (req, res) => {
        const followerUid = req.user.uid;
        const followeeUid = parseInt(req.params.uid, 10);

        if (!Number.isFinite(followeeUid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const result = await this.followUser.execute({ followerUid, followeeUid }, { source: "http" });
        res.json(result);
    };

    unfollow = async (req, res) => {
        const followerUid = req.user.uid;
        const followeeUid = parseInt(req.params.uid, 10);

        if (!Number.isFinite(followeeUid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const result = await this.unfollowUser.execute({ followerUid, followeeUid }, { source: "http" });
        res.json(result);
    };

    followers = async (req, res) => {
        const uid = parseInt(req.params.uid, 10);
        if (!Number.isFinite(uid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
        const includeProfiles = String(req.query.includeProfiles ?? "true") !== "false";

        const data = await this.listFollowers.execute({ uid, limit, offset, includeProfiles });
        res.json(data);
    };

    following = async (req, res) => {
        const uid = parseInt(req.params.uid, 10);
        if (!Number.isFinite(uid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
        const includeProfiles = String(req.query.includeProfiles ?? "true") !== "false";

        const data = await this.listFollowing.execute({ uid, limit, offset, includeProfiles });
        res.json(data);
    };

    followStatus = async (req, res) => {
        const followerUid = req.user.uid;
        const followeeUid = parseInt(req.params.uid, 10);

        if (!Number.isFinite(followeeUid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const data = await this.getFollowStatus.execute({ followerUid, followeeUid });
        res.json(data);
    };

    followCounts = async (req, res) => {
        const uid = parseInt(req.params.uid, 10);
        if (!Number.isFinite(uid)) {
            return res.status(400).json({ error: "invalid uid" });
        }

        const data = await this.getFollowCounts.execute({ uid });
        res.json(data);
    };
}

module.exports = UserProfileController;
