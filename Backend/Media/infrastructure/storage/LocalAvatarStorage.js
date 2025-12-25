const fs = require('fs/promises');
const path = require('path');

class LocalAvatarStorage {
    constructor({ baseDir, avatarDirName = 'avatars' }) {
        if (!baseDir) throw new Error('baseDir is required');
        this.baseDir = baseDir;
        this.avatarDirName = avatarDirName;
    }

    avatarDir() {
        return path.join(this.baseDir, this.avatarDirName);
    }

    /**
     * Ensures upload directories exist.
     */
    async ensureReady() {
        await fs.mkdir(this.avatarDir(), { recursive: true });
    }

    /**
     * Determine file extension from MIME type.
     * Keep this strict for MVP.
     */
    extFromMime(mimeType) {
        const map = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/webp': 'webp'
        };
        return map[mimeType] || null;
    }

    /**
     * Relative path stored in DB, e.g. "avatars/1.webp"
     */
    buildRelativePath(uid, mimeType) {
        const ext = this.extFromMime(mimeType);
        if (!ext) throw new Error('Unsupported image type');
        return `${this.avatarDirName}/${uid}.${ext}`;
    }

    /**
     * Absolute file path on disk.
     */
    toAbsolutePath(relativePath) {
        // relativePath like "avatars/1.webp"
        return path.join(this.baseDir, relativePath);
    }

    /**
     * Save (overwrite) avatar bytes.
     * @returns {object} { relativePath, absolutePath, sizeBytes }
     */
    async save(uid, { buffer, mimeType }) {
        if (!uid) throw new Error('uid is required');
        if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('buffer (Buffer) is required');
        if (!mimeType) throw new Error('mimeType is required');

        await this.ensureReady();

        const relativePath = this.buildRelativePath(uid, mimeType);
        const absolutePath = this.toAbsolutePath(relativePath);

        await fs.writeFile(absolutePath, buffer);

        return {
            relativePath,
            absolutePath,
            sizeBytes: buffer.length
        };
    }

    /**
     * Delete file if it exists (no throw if missing).
     */
    async deleteIfExists(relativePath) {
        if (!relativePath) return;

        const abs = this.toAbsolutePath(relativePath);
        try {
            await fs.unlink(abs);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    }
}

module.exports = LocalAvatarStorage;
