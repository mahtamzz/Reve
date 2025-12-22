const jwt = require('jsonwebtoken');

class JwtVerifier {
    constructor({
        secret,
        issuer,
        audience,
        algorithms = ['HS256']
    }) {
        if (!secret) {
            throw new Error('JWT secret is required');
        }

        this.secret = secret;
        this.issuer = issuer;
        this.audience = audience;
        this.algorithms = algorithms;
    }

    verify(token) {
        return jwt.verify(token, this.secret, {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: this.algorithms
        });
    }
}

module.exports = JwtVerifier;
