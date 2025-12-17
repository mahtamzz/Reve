class GetDashboard {
    constructor(profileRepo, dailyRepo) {
        this.profileRepo = profileRepo;
        this.dailyRepo = dailyRepo;
    }

    async execute(uid) {
        const profile = await this.profileRepo.findByUid(uid);
        if (!profile) throw new Error('Profile not found');

        const today = new Date().toISOString().slice(0, 10);
        const todayStudy = await this.dailyRepo.findByUidAndDate(uid, today);

        return {
            profile,
            todayStudyMinutes: todayStudy?.total_duration_minutes || 0
        };
    }
}

module.exports = GetDashboard;
