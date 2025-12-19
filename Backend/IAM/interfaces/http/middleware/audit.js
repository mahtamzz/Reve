const AuditRepo = require('../../../infrastructure/repositories/AuditRepositoryPg');

function auditMiddleware(action) {
    return async (req, res, next) => {
        try {
            await AuditRepo.log({
                user_id: req.user?.id || null,
                action,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                details: { body: req.body },
            });
        } catch (err) {
            console.error('Audit logging failed', err);
        }
        next();
    };
}

module.exports = auditMiddleware;
