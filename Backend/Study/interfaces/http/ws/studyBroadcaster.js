function toDateOnlyUTC(d = new Date()) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

class StudyBroadcaster {
    constructor({ io, studyPresenceStore, subjectDstRepo }) {
        this.io = io;
        this.studyPresenceStore = studyPresenceStore;
        this.subjectDstRepo = subjectDstRepo;
    }

    async broadcastTodayMins(uid, isoOrDate = null) {
        if (!this.io || !this.studyPresenceStore) return;

        const day = toDateOnlyUTC(isoOrDate ? new Date(isoOrDate) : new Date());

        let todayMinsBase = 0;
        if (this.subjectDstRepo?.getTotalByDay) {
            try {
                todayMinsBase = await this.subjectDstRepo.getTotalByDay(uid, day);
            } catch {
                todayMinsBase = 0;
            }
        }

        const groupIds = await this.studyPresenceStore.getRememberedGroups(String(uid));

        for (const groupId of groupIds || []) {
            this.io.to(`group:${groupId}`).emit("study_presence:update", {
                uid,
                day,
                todayMinsBase,
                reason: "session_logged",
            });
        }
    }
}

module.exports = StudyBroadcaster;
