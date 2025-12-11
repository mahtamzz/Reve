const jwt = require("jsonwebtoken");
const env = require("../../config/env");

class JwtService {
    generate(payload) {
        return jwt.sign(payload, env.JWT_KEY, { expiresIn: "1h" });
    }

    verify(token) {
        return jwt.verify(token, env.JWT_KEY);
    }

    generateRefreshToken(payload) {
        return jwt.sign(payload, env.JWT_KEY, { expiresIn: "7d" });
    }

    verifyRefresh(token) {
        return jwt.verify(token, env.JWT_KEY);
    }
}


module.exports = new JwtService();
