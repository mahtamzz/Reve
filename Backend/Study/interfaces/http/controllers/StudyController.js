class StudyController {
    constructor({
        createSubject,
        listSubjects,
        updateSubject,
        deleteSubject,
        logStudySession,
        listStudySessions,
        getDashboard,
        updateWeeklyGoal
    }) {
        this.createSubject = createSubject;
        this.listSubjects = listSubjects;
        this.updateSubject = updateSubject;
        this.deleteSubject = deleteSubject;
        this.logStudySession = logStudySession;
        this.listStudySessions = listStudySessions;
        this.getDashboard = getDashboard;
        this.updateWeeklyGoal = updateWeeklyGoal;

        this.createSubjectHandler = this.createSubjectHandler.bind(this);
        this.listSubjectsHandler = this.listSubjectsHandler.bind(this);
        this.updateSubjectHandler = this.updateSubjectHandler.bind(this);
        this.deleteSubjectHandler = this.deleteSubjectHandler.bind(this);

        this.logSessionHandler = this.logSessionHandler.bind(this);
        this.listSessionsHandler = this.listSessionsHandler.bind(this);

        this.getDashboardHandler = this.getDashboardHandler.bind(this);
        this.updateWeeklyGoalHandler = this.updateWeeklyGoalHandler.bind(this);
    }

    async createSubjectHandler(req, res) {
        try {
            const uid = req.actor.uid;
            const { name, color } = req.body;

            const subject = await this.createSubject.execute(uid, name, color ?? null);
            res.status(201).json(subject);
        } catch (err) {
            if (err.code === "SUBJECT_NAME_EXISTS") {
                return res.status(409).json({ error: "Subject name already exists" });
            }
            throw err;
        }
    }

    async listSubjectsHandler(req, res) {
        const uid = req.actor.uid;
        const subjects = await this.listSubjects.execute(uid);
        res.json(subjects);
    }

    async updateSubjectHandler(req, res) {
        const uid = req.actor.uid;
        const { subjectId } = req.params;
        const fields = req.body;

        const updated = await this.updateSubject.execute(uid, subjectId, fields);
        if (!updated) return res.status(404).json({ error: "Subject not found" });

        res.json(updated);
    }

    async deleteSubjectHandler(req, res) {
        const uid = req.actor.uid;
        const { subjectId } = req.params;

        const ok = await this.deleteSubject.execute(uid, subjectId);
        if (!ok) return res.status(404).json({ error: "Subject not found" });

        res.status(204).send();
    }

    async logSessionHandler(req, res) {
        const uid = req.actor.uid;
        const { subjectId, durationMins, startedAt } = req.body;

        const session = await this.logStudySession.execute(
            uid,
            subjectId,
            durationMins,
            startedAt ?? null
        );

        res.status(201).json(session);
    }

    async listSessionsHandler(req, res) {
        const uid = req.actor.uid;
        const { from, to, limit, offset } = req.query;

        const sessions = await this.listStudySessions.execute(uid, {
            from: from ?? null,
            to: to ?? null,
            limit: limit ? Number(limit) : 50,
            offset: offset ? Number(offset) : 0
        });

        res.json(sessions);
    }

    async getDashboardHandler(req, res) {
        const uid = req.actor.uid;
        const { from, to } = req.query;

        const dashboard = await this.getDashboard.execute(uid, {
            from: from ?? null,
            to: to ?? null
        });

        res.json(dashboard);
    }

    async updateWeeklyGoalHandler(req, res) {
        const uid = req.actor.uid;
        const { weeklyGoalMins } = req.body;

        const updated = await this.updateWeeklyGoal.execute(uid, Number(weeklyGoalMins));
        res.json(updated);
    }
}

module.exports = StudyController;
