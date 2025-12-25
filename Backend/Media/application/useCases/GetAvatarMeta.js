class GetAvatarMeta {
    constructor(avatarRepo) {
        this.avatarRepo = avatarRepo;
    }

    async execute(uid) {
        if (!uid) throw new Error('uid is required');
        return this.avatarRepo.findByUid(uid);
    }
}

module.exports = GetAvatarMeta;
