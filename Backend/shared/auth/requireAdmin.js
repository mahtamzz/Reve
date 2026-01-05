module.exports = function requireAdmin(req, res, next) {
    if (req.actor?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
};