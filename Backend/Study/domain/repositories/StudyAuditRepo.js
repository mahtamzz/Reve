class StudyAuditRepo {
    async log({ uid, action, subjectId = null, metadata = null }) {
        throw new Error('Not implemented');
    }

    async listByUser(uid, { limit = 50, offset = 0 } = {}) {
        throw new Error('Not implemented');
    }
}

module.exports = StudyAuditRepo;
