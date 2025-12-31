const cookie = require("cookie");

module.exports = function socketAuthMiddleware(jwtVerifier) {
    return (socket, next) => {
        try {
            let token = null;

            // 1) Authorization header
            const authHeader = socket.handshake.headers?.authorization;
            if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7);

            // 2) Cookie accessToken (HttpOnly cookie sent automatically by browser)
            if (!token && socket.handshake.headers?.cookie) {
                const parsed = cookie.parse(socket.handshake.headers.cookie);
                token = parsed?.accessToken;
            }

            if (!token) return next(new Error("Authorization token required"));

            const decoded = jwtVerifier.verify(token);
            if (!decoded?.uid) return next(new Error("Invalid token payload"));

            socket.user = { uid: decoded.uid };
            return next();
        } catch (err) {
            if (err.name === "TokenExpiredError") return next(new Error("Token expired"));
            return next(new Error("Invalid token"));
        }
    };
};
