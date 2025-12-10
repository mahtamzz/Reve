const JwtService = require("../infrastructure/auth/JwtService");

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = JwtService.verify(token);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden" });
        }

        req.admin = { admin_id: decoded.admin_id, username: decoded.username };
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
