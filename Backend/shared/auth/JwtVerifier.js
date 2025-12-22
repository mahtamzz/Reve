const jwt = require('jsonwebtoken');

class JwtVerifier {
    constructor({ secret }) {
        if (!secret) {
            throw new Error('JWT secret is required');
        }
        this.secret = secret;
    }

    verify(token) {
        try {
            return jwt.verify(token, this.secret);
        } catch (err) {
            console.error("JWT Verification failed in Profile Service!");
            console.error("Reason:", err.message); 
            console.error("Secret being used (first 3 chars):", this.secret.substring(0,3));
            throw err;
        }
    }
}

module.exports = JwtVerifier;
