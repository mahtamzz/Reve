const JwtService = require("../../../infrastructure/auth/JwtService");

const authMiddleware = (req, res, next) => {
    // Read token from cookie
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    try {
        const decoded = JwtService.verify(token);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
