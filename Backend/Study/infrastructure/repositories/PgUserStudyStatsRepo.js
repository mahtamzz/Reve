const UserStudyStatsRepo = require('../../domain/repositories/UserStudyStatsRepo');

class PgUserStudyStatsRepo extends UserStudyStatsRepo {
    constructor(db) {
        super();
        this.db = db;
    }

    async ensure(uid) {
        await this.db.query(
            `
      INSERT INTO user_study_stats (uid)
      VALUES ($1)
      ON CONFLICT (uid) DO NOTHING
      `,
            [uid]
        );
    }

    async get(uid) {
        const result = await this.db.query(
            `SELECT * FROM user_study_stats WHERE uid = $1`,
            [uid]
        );
        return result.rows[0] || null;
    }

    async updateWeeklyGoal(uid, weeklyGoalMins) {
        const result = await this.db.query(
            `
      INSERT INTO user_study_stats (uid, weekly_goal_mins)
      VALUES ($1, $2)
      ON CONFLICT (uid)
      DO UPDATE SET
        weekly_goal_mins = EXCLUDED.weekly_goal_mins,
        updated_at = now()
      RETURNING *
      `,
            [uid, weeklyGoalMins]
        );
        return result.rows[0];
    }

    async addXp(uid, delta) {
        const result = await this.db.query(
            `
      INSERT INTO user_study_stats (uid, xp_total)
      VALUES ($1, GREATEST($2, 0))
      ON CONFLICT (uid)
      DO UPDATE SET
        xp_total = user_study_stats.xp_total + GREATEST($2, 0),
        updated_at = now()
      RETURNING *
      `,
            [uid, delta]
        );
        return result.rows[0];
    }

    async setStreak(uid, streakCurrent, streakBest, streakLastDay) {
        const result = await this.db.query(
            `
      INSERT INTO user_study_stats (uid, streak_current, streak_best, streak_last_day)
      VALUES ($1, $2, $3, $4::date)
      ON CONFLICT (uid)
      DO UPDATE SET
        streak_current = EXCLUDED.streak_current,
        streak_best = EXCLUDED.streak_best,
        streak_last_day = EXCLUDED.streak_last_day,
        updated_at = now()
      RETURNING *
      `,
            [uid, streakCurrent, streakBest, streakLastDay]
        );

        return result.rows[0];
    }
}

module.exports = PgUserStudyStatsRepo;
