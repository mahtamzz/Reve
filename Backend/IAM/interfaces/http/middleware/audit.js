function auditMiddleware(auditRepo, action) {
    return async (req, res, next) => {
        try {
            await auditRepo.log({
                user_id: req.user?.id || null,
                action,
                ip_address: req.ip,
                user_agent: req.get("User-Agent"),
                details: { body: req.body },
            });
        } catch (err) {
            console.error("Audit logging failed", err);
        }
        next();
    };
}

module.exports = auditMiddleware;
