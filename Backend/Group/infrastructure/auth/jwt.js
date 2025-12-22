const JwtVerifier = require('../../../shared/auth/JwtVerifier');

const jwtVerifier = new JwtVerifier({
    secret: process.env.JWT_SECRET,
    issuer: process.env.JWT_ISSUER,
    audience: 'group-service'
});

module.exports = jwtVerifier;
