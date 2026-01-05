module.exports = function authenticate(jwtVerifier) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization || "";
        const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
        const cookieToken = req.cookies?.accessToken;
        const token = bearer || cookieToken;

        if (!token) return res.status(401).json({ message: "Authorization token required" });

        try {
            const decoded = jwtVerifier.verify(token);

            const isAdmin = decoded?.role === "admin" && !!decoded?.admin_id;
            const isUser = !!decoded?.uid;

            if (!isAdmin && !isUser) {
                return res.status(401).json({ message: "Invalid token payload" });
            }

            req.actor = isAdmin
                ? { type: "admin", role: "admin", adminId: decoded.admin_id, username: decoded.username ?? null }
                : { type: "user", role: "user", uid: decoded.uid, username: decoded.username ?? null };

            // Backward compat (optional)
            if (isAdmin) req.admin = { admin_id: decoded.admin_id, username: decoded.username ?? null };
            if (isUser) req.user = { uid: decoded.uid, username: decoded.username ?? null };

            next();
        } catch (err) {
            if (err.name === "TokenExpiredError") return res.status(401).json({ message: "Token expired" });
            return res.status(401).json({ message: "Invalid token" });
        }
    };
};
