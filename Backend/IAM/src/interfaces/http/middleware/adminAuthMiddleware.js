const JwtService = require("../../../infrastructure/auth/JwtService");

module.exports = (req, res, next) => {
    try {
        const token = req.cookies?.token; // read from cookie
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = JwtService.verify(token);

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        req.admin = { admin_id: decoded.admin_id, username: decoded.username };
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
