class SubjectRepo {
    async create(ownerUid, name, color = null) {
        throw new Error('Not implemented');
    }

    async findById(subjectId, ownerUid) {
        throw new Error('Not implemented');
    }

    async listByOwner(ownerUid) {
        throw new Error('Not implemented');
    }

    async update(subjectId, ownerUid, fields) {
        throw new Error('Not implemented');
    }

    async delete(subjectId, ownerUid) {
        throw new Error('Not implemented');
    }
}

module.exports = SubjectRepo;
