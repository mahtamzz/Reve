module.exports = function canGroupAdminister({ actor, actorRole }) {
    if (actor?.role === "admin") return true; // platform admin override
    return actorRole === "owner" || actorRole === "admin";
};