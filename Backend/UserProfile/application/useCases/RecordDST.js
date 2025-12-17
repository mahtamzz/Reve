class RecordDST {
    constructor(dailyRepo, profileRepo) {
        this.dailyRepo = dailyRepo;
        this.profileRepo = profileRepo;
    }

    async execute({ uid, date, minutes }) {
        await this.dailyRepo.upsert(uid, date, minutes);

        const xpEarned = minutes; // simple rule for now
        await this.profileRepo.incrementXp(uid, xpEarned);
    }
}

module.exports = RecordDST;
