module.exports = function requireUser(req, res, next) {
    if (req.actor?.type !== "user") return res.status(401).json({ message: "User token required" });
    next();
};