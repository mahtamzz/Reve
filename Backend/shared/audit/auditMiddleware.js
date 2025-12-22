module.exports = function auditMiddleware(auditRepo, action) {
    return async (req, res, next) => {
        try {
            await auditRepo.log({
                actorUid: req.user?.uid || null,
                action,
                metadata: {
                    body: req.body,
                    path: req.originalUrl,
                    method: req.method
                }
            });
        } catch (err) {
            console.error('Audit logging failed', err);
        }

        next();
    };
};
