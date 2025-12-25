class UploadAvatar {
    constructor({ avatarRepo, storage, maxBytes = 2 * 1024 * 1024 }) {
        this.avatarRepo = avatarRepo;
        this.storage = storage;
        this.maxBytes = maxBytes;
    }

    async execute(uid, { buffer, mimeType }) {
        if (!uid) throw new Error('uid is required');
        if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('file buffer is required');
        if (!mimeType) throw new Error('mimeType is required');

        if (buffer.length > this.maxBytes) {
            const err = new Error(`Avatar too large. Max ${this.maxBytes} bytes`);
            err.code = 'AVATAR_TOO_LARGE';
            throw err;
        }

        // Get old avatar to delete old file after successful save
        const old = await this.avatarRepo.findByUid(uid);

        // 1) Save file to disk (overwrite is fine; but ext can change, so we still delete old file)
        const saved = await this.storage.save(uid, { buffer, mimeType });

        // 2) Upsert DB metadata for current avatar
        const row = await this.avatarRepo.upsert(uid, saved.relativePath, mimeType, saved.sizeBytes);

        // 3) Delete old file if it was a different path
        if (old?.file_path && old.file_path !== saved.relativePath) {
            await this.storage.deleteIfExists(old.file_path);
        }

        return row;
    }
}

module.exports = UploadAvatar;
