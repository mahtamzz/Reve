const cookie = require("cookie");

// Tries cookie first (recommended since you already use credentials:true), then Authorization header.
function extractTokenFromHandshake(socket) {
    const cookieHeader = socket.handshake.headers?.cookie;
    if (cookieHeader) {
        const parsed = cookie.parse(cookieHeader);

        // Adjust cookie name(s) to match your IAM service
        const candidates = [
            process.env.JWT_COOKIE_NAME, // optional
            "access_token",
            "accessToken",
            "token",
            "jwt"
        ].filter(Boolean);

        for (const name of candidates) {
            if (parsed[name]) return parsed[name];
        }
    }

    const authHeader = socket.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.slice("Bearer ".length);
    }

    // socket.io client can also send auth: { token }
    const authToken = socket.handshake.auth?.token;
    if (authToken) return authToken;

    return null;
}

module.exports = function socketAuthMiddleware(jwtVerifier) {
    return async (socket, next) => {
        try {
            const token = extractTokenFromHandshake(socket);
            if (!token) {
                const err = new Error("Unauthorized");
                err.code = "UNAUTHORIZED";
                return next(err);
            }

            const payload = await jwtVerifier.verify(token); // must match your shared JwtVerifier API
            if (!payload?.uid) {
                const err = new Error("Unauthorized");
                err.code = "UNAUTHORIZED";
                return next(err);
            }

            socket.user = { uid: payload.uid };
            return next();
        } catch (e) {
            const err = new Error("Unauthorized");
            err.code = "UNAUTHORIZED";
            return next(err);
        }
    };
};
