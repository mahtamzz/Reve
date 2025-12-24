class SubjectDSTRepo {
    async addMinutes({ uid, day, subjectId = null, minutes }) {
        throw new Error('Not implemented');
    }

    async getByDay(uid, day) {
        throw new Error('Not implemented');
    }

    async getTotalByDay(uid, day) {
        throw new Error('Not implemented');
    }

    async listTotals(uid, { from, to }) {
        throw new Error('Not implemented');
    }
}

module.exports = SubjectDSTRepo;
