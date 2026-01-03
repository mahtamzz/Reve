class FollowRepository {
    create({ followerUid, followeeUid }) { throw new Error("Not implemented"); }
    delete(followerUid, followeeUid) { throw new Error("Not implemented"); }
    exists(followerUid, followeeUid) { throw new Error("Not implemented"); }

    listFollowers(uid, { limit, offset }) { throw new Error("Not implemented"); }
    listFollowing(uid, { limit, offset }) { throw new Error("Not implemented"); }

    countFollowers(uid) { throw new Error("Not implemented"); }
    countFollowing(uid) { throw new Error("Not implemented"); }
}

module.exports = FollowRepository;
