const createAuthMiddleware = (jwtService) => {
    return (req, res, next) => {
        const token = req.cookies?.accessToken; // match setTokenCookie

        if (!token) return res.status(401).json({ message: "Authorization token required" });

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
