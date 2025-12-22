module.exports = function authMiddleware(jwtVerifier) {
    return (req, res, next) => {
        let token = null;

        // 1️⃣ Try Authorization header (Swagger)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2️⃣ Fallback to cookie (frontend)
        if (!token) {
            token = req.cookies?.accessToken;
        }

        if (!token) {
            return res.status(401).json({ message: "Authorization token required" });
        }

        try {
            const decoded = jwtVerifier.verify(token);

            if (!decoded.uid) {
                return res.status(401).json({ message: "Invalid token payload" });
            }

            req.user = { uid: decoded.uid };
            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired" });
            }

            return res.status(401).json({ message: "Invalid token" });
        }
    };
};
