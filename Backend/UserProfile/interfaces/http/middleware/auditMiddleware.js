const AuditRepo = require('../../../infrastructure/repositories/PgAuditRepo');

function auditMiddleware(action) {
    return async (req, res, next) => {
        try {
            await AuditRepo.log(
                req.user?.uid || null,
                action,
                {
                    body: req.body,
                    path: req.originalUrl,
                    method: req.method
                }
            );
        } catch (err) {
            // Never block request on audit failure
            console.error('Audit logging failed', err);
        }
        next();
    };
}

module.exports = auditMiddleware;
