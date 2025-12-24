class UserStudyStatsRepo {
    async ensure(uid) {
        throw new Error('Not implemented');
    }

    async get(uid) {
        throw new Error('Not implemented');
    }

    async updateWeeklyGoal(uid, weeklyGoalMins) {
        throw new Error('Not implemented');
    }

    async addXp(uid, delta) {
        throw new Error('Not implemented');
    }

    /**
     * Update streak fields in one go (including streak_last_day).
     */
    async setStreak(uid, streakCurrent, streakBest, streakLastDay) {
        throw new Error('Not implemented');
    }
}

module.exports = UserStudyStatsRepo;
