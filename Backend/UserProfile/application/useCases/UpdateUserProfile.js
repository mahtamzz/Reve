class UpdateUserProfile {
    constructor(profileRepo, auditRepo) {
        this.profileRepo = profileRepo;
        this.auditRepo = auditRepo;
    }

    async execute(uid, updates) {
        await this.profileRepo.update(uid, updates);
        await this.auditRepo.log(uid, 'PROFILE_UPDATED', updates);
    }
}

module.exports = UpdateUserProfile;
