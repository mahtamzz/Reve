class StudySessionRepo {
    async create({ uid, subjectId = null, startedAt = null, durationMins }) {
        throw new Error('Not implemented');
    }

    async findById(sessionId) {
        throw new Error('Not implemented');
    }

    async listByUser(uid, { from = null, to = null, limit = 50, offset = 0 } = {}) {
        throw new Error('Not implemented');
    }

    async delete(sessionId, uid) {
        throw new Error('Not implemented');
    }
}

module.exports = StudySessionRepo;
