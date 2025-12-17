const JwtService = require('../../../infrastructure/auth/JwtVerifier');

const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: 'Authorization token required' });
    }

    try {
        const decoded = JwtService.verify(token);

        if (!decoded.uid) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
