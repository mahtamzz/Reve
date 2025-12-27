const jwt = require("jsonwebtoken");
const crypto = require("crypto");

class JwtService {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    generate(payload, expiresIn = "15m") {
        return jwt.sign({ ...payload, typ: "access" }, this.secretKey, { expiresIn });
    }

    verify(token) {
        const decoded = jwt.verify(token, this.secretKey);
        if (decoded.typ && decoded.typ !== "access") throw new Error("Not an access token");
        return decoded;
    }

    generateRefreshToken(payload, expiresIn = "7d") {
        const jti = crypto.randomUUID();
        return jwt.sign({ ...payload, jti, typ: "refresh" }, this.secretKey, { expiresIn });
    }

    verifyRefresh(token) {
        const decoded = jwt.verify(token, this.secretKey);
        if (decoded.typ !== "refresh") throw new Error("Not a refresh token");
        if (!decoded.jti) throw new Error("Refresh token missing jti");
        return decoded;
    }
}

module.exports = JwtService;
