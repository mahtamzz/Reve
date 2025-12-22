class UpdateUserProfile {
    constructor(profileRepo, auditRepo) {
        this.profileRepo = profileRepo;
        this.auditRepo = auditRepo;
    }

    async execute(uid, updates) {
        await this.profileRepo.update(uid, updates);
        // Wrap arguments in an object
        await this.auditRepo.log({ 
            actorUid: uid, 
            action: 'PROFILE_UPDATED', 
            metadata: updates 
        });
    }
}

module.exports = UpdateUserProfile;
