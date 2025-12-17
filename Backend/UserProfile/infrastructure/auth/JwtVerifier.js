const jwt = require('jsonwebtoken');
const env = require('../../config/env');

class JwtVerifier {
    verify(token) {
        return jwt.verify(token, env.JWT_KEY, {
            issuer: env.JWT_ISSUER
        });
    }
}

module.exports = new JwtVerifier();
