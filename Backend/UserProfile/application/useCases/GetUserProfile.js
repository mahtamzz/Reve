class GetUserProfile {
    constructor(profileRepo, prefsRepo) {
        this.profileRepo = profileRepo;
        this.prefsRepo = prefsRepo;
    }

    async execute(uid) {
        const profile = await this.profileRepo.findByUid(uid);
        if (!profile) throw new Error('Profile not found');

        const preferences = await this.prefsRepo.findByUid(uid);

        return {
            profile,
            preferences
        };
    }
}

module.exports = GetUserProfile;
