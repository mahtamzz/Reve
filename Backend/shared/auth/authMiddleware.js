module.exports = function authMiddleware(JwtVerifier) {
    return (req, res, next) => {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Authorization token required' });
        }

        try {
            const decoded = JwtVerifier.verify(token);

            if (!decoded.uid) {
                return res.status(401).json({ message: 'Invalid token payload' });
            }

            req.user = { uid: decoded.uid };
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }

            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};
