class JwtService {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }

    generate(payload, expiresIn = "1h") {
        return require("jsonwebtoken").sign(payload, this.secretKey, { expiresIn });
    }

    verify(token) {
        return require("jsonwebtoken").verify(token, this.secretKey);
    }

    generateRefreshToken(payload, expiresIn = "7d") {
        return require("jsonwebtoken").sign(payload, this.secretKey, { expiresIn });
    }

    verifyRefresh(token) {
        return require("jsonwebtoken").verify(token, this.secretKey);
    }
}

module.exports = JwtService;
