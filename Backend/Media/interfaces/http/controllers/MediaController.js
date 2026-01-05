const path = require("path");

class MediaController {
    constructor({ uploadAvatar, getAvatarMeta, deleteAvatar, storage }) {
        this.uploadAvatar = uploadAvatar;
        this.getAvatarMeta = getAvatarMeta;
        this.deleteAvatar = deleteAvatar;
        this.storage = storage;

        this.uploadAvatarHandler = this.uploadAvatarHandler.bind(this);
        this.getMyAvatarHandler = this.getMyAvatarHandler.bind(this);
        this.getUserAvatarHandler = this.getUserAvatarHandler.bind(this);
        this.deleteAvatarHandler = this.deleteAvatarHandler.bind(this);
    }

    async uploadAvatarHandler(req, res) {
        const uid = req.actor.uid;
        if (!req.file) return res.status(400).json({ error: "File required" });

        const avatar = await this.uploadAvatar.execute(uid, {
            buffer: req.file.buffer,
            mimeType: req.file.mimetype
        });

        res.status(201).json(avatar);
    }

    async getMyAvatarHandler(req, res) {
        const uid = req.actor.uid;
        const meta = await this.getAvatarMeta.execute(uid);
        if (!meta) return res.status(404).end();

        res.sendFile(this.storage.toAbsolutePath(meta.file_path));
    }

    async getUserAvatarHandler(req, res) {
        const uid = Number(req.params.uid);
        const meta = await this.getAvatarMeta.execute(uid);
        if (!meta) return res.status(404).end();

        res.sendFile(this.storage.toAbsolutePath(meta.file_path));
    }

    async deleteAvatarHandler(req, res) {
        const uid = req.actor.uid;
        const ok = await this.deleteAvatar.execute(uid);
        if (!ok) return res.status(404).end();

        res.status(204).end();
    }
}

module.exports = MediaController;
