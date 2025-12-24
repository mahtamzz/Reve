class UpdateWeeklyGoal {
    constructor(statsRepo, auditRepo) {
        this.statsRepo = statsRepo;
        this.auditRepo = auditRepo;
    }

    async execute(uid, weeklyGoalMins) {
        if (!Number.isInteger(weeklyGoalMins) || weeklyGoalMins < 0) {
            throw new Error('weeklyGoalMins must be a non-negative integer');
        }

        const updated = await this.statsRepo.updateWeeklyGoal(uid, weeklyGoalMins);

        await this.auditRepo.log({
            uid,
            action: 'stats.weekly_goal_updated',
            metadata: { weeklyGoalMins }
        });

        return updated;
    }
}

module.exports = UpdateWeeklyGoal;
