class DeleteAvatar {
    constructor({ avatarRepo, storage }) {
        this.avatarRepo = avatarRepo;
        this.storage = storage;
    }

    async execute(uid) {
        if (!uid) throw new Error('uid is required');

        const current = await this.avatarRepo.findByUid(uid);
        if (!current) return false;

        // Delete DB row first or file first? Either is OK.
        // Safer: delete file first, then DB. (If file delete fails, you keep metadata.)
        await this.storage.deleteIfExists(current.file_path);
        await this.avatarRepo.deleteByUid(uid);

        return true;
    }
}

module.exports = DeleteAvatar;
