function todayUTCDate() {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function daysAgoUTC(n) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - n);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

class GetDashboard {
    constructor({ subjectRepo, subjectDstRepo, statsRepo }) {
        this.subjectRepo = subjectRepo;
        this.subjectDstRepo = subjectDstRepo;
        this.statsRepo = statsRepo;
    }

    async execute(uid, range = {}) {
        const to = range.to ?? todayUTCDate();
        const from = range.from ?? daysAgoUTC(6); // last 7 days by default

        const [subjects, totals, stats] = await Promise.all([
            this.subjectRepo.listByOwner(uid),
            this.subjectDstRepo.listTotals(uid, from, to),
            this.statsRepo.get(uid)
        ]);

        return {
            range: { from, to },
            subjects,
            totals, // [{ uid, day, total_duration_mins }]
            stats: stats || {
                uid,
                weekly_goal_mins: 0,
                xp_total: 0,
                streak_current: 0,
                streak_best: 0
            }
        };
    }
}

module.exports = GetDashboard;
