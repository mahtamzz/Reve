function toDateOnlyUTC(isoOrDate) {
    const d = isoOrDate ? new Date(isoOrDate) : new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

class LogStudySession {
    constructor({ sessionRepo, subjectDstRepo, statsRepo, auditRepo, subjectRepo }) {
        this.sessionRepo = sessionRepo;
        this.subjectDstRepo = subjectDstRepo;
        this.statsRepo = statsRepo;
        this.auditRepo = auditRepo;
        this.subjectRepo = subjectRepo;
    }

    async execute(uid, subjectId, durationMins, startedAt = null) {
        if (!uid) throw new Error('uid is required');
        if (!subjectId) throw new Error('subjectId is required');
        if (!Number.isInteger(durationMins) || durationMins <= 0) {
            throw new Error('durationMins must be a positive integer');
        }

        const subject = await this.subjectRepo.findById(subjectId, uid);
        if (!subject) throw new Error('Subject not found');

        const session = await this.sessionRepo.create(uid, subjectId, startedAt, durationMins);

        const day = toDateOnlyUTC(session.started_at);
        await this.subjectDstRepo.addMinutes(uid, day, subjectId, durationMins);

        await this.statsRepo.ensure(uid);
        await this.statsRepo.addXp(uid, durationMins);

        const todayTotal = await this.subjectDstRepo.getTotalByDay(uid, day);

        // ✅ streak update (correct with streak_last_day)
        const stats = await this.statsRepo.get(uid);
        const streakCurrent = stats?.streak_current ?? 0;
        const streakBest = stats?.streak_best ?? 0;
        const streakLastDay = stats?.streak_last_day ?? null;

        if (todayTotal > 0) {
            if (streakLastDay !== day) {
                const d = new Date(`${day}T00:00:00Z`);
                d.setUTCDate(d.getUTCDate() - 1);
                const yyy = d.getUTCFullYear();
                const ymm = String(d.getUTCMonth() + 1).padStart(2, '0');
                const ydd = String(d.getUTCDate()).padStart(2, '0');
                const yesterday = `${yyy}-${ymm}-${ydd}`;

                const newCurrent = (streakLastDay === yesterday) ? (streakCurrent + 1) : 1;
                const newBest = Math.max(streakBest, newCurrent);

                // ✅ correct call: (uid, int, int, date)
                await this.statsRepo.setStreak(uid, newCurrent, newBest, day);
            }
        }

        // audit (if you still want it in use cases)
        await this.auditRepo.log({
            uid,
            action: 'session.logged',
            subjectId,
            metadata: { durationMins, startedAt: session.started_at }
        });

        return session;
    }
}

module.exports = LogStudySession;
