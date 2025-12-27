const createAuthMiddleware = (jwtService) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization || "";
        const bearer =
            authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

        const cookieToken = req.cookies?.accessToken;

        const token = bearer || cookieToken;

        if (!token) {
            return res.status(401).json({ message: "Authorization token required" });
        }

        try {
            const decoded = jwtService.verify(token);
            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired" });
            }
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};

module.exports = createAuthMiddleware;
