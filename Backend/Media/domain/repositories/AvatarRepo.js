class AvatarRepo {
    async upsert(uid, filePath, mimeType, sizeBytes) {
        throw new Error('Not implemented');
    }

    async findByUid(uid) {
        throw new Error('Not implemented');
    }

    async deleteByUid(uid) {
        throw new Error('Not implemented');
    }
}

module.exports = AvatarRepo;
