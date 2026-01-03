class GetDashboard {
    constructor(profileRepo, dailyRepo) {
        this.profileRepo = profileRepo;
        this.dailyRepo = dailyRepo;
    }

    async execute(uid) {
        const profile = await this.profileRepo.findByUid(uid);
        if (!profile) throw new Error("Profile not found");
    
        const today = new Date().toISOString().slice(0, 10);
    
        let todayStudyMinutes = 0;
        try {
        const todayStudy = await this.dailyRepo.findByUidAndDate(uid, today);
        todayStudyMinutes = todayStudy?.total_duration_minutes || 0;
        } catch (e) {
        todayStudyMinutes = 0;
        }
    
        return { profile, todayStudyMinutes };
    }
    
}

module.exports = GetDashboard;
