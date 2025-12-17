class CreateUserProfile {
    constructor(profileRepo, prefsRepo, auditRepo) {
        this.profileRepo = profileRepo;
        this.prefsRepo = prefsRepo;
        this.auditRepo = auditRepo;
    }

    async execute({ uid, displayName, timezone }) {
        const existing = await this.profileRepo.findByUid(uid);
        if (existing) return;

        await this.profileRepo.create({
            uid,
            displayName,
            timezone
        });

        await this.prefsRepo.upsert(uid, {
            isProfilePublic: true,
            showStreak: true
        });

        await this.auditRepo.log(uid, 'PROFILE_CREATED');
    }
}

module.exports = CreateUserProfile;
