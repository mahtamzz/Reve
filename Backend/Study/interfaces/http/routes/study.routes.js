const express = require('express');

module.exports = function createStudyRoutes({ controller, auth, requireUser, requireAdmin }) {
    const router = express.Router();

    // Subjects
    router.post("/subjects", auth, requireUser, controller.createSubjectHandler);
    router.get("/subjects", auth, requireUser, controller.listSubjectsHandler);
    router.patch("/subjects/:subjectId", auth, requireUser, controller.updateSubjectHandler);
    router.delete("/subjects/:subjectId", auth, requireUser, controller.deleteSubjectHandler);

    // Sessions
    router.post("/sessions", auth, requireUser, controller.logSessionHandler);
    router.get("/sessions", auth, requireUser, controller.listSessionsHandler);

    // Stats
    router.get("/dashboard", auth, requireUser, controller.getDashboardHandler);
    router.patch("/stats/weekly-goal", auth, requireUser, controller.updateWeeklyGoalHandler);

    /**
     * @swagger
     * tags:
     *   name: Study
     *   description: Subjects, study sessions, XP, and streak tracking
     */

    /**
     * @swagger
     * /api/study/subjects:
     *   post:
     *     summary: Create a new study subject
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 example: Mathematics
     *               color:
     *                 type: string
     *                 example: "#FFAA00"
     *     responses:
     *       201:
     *         description: Subject created
     *       400:
     *         description: Invalid input
     *
     *   get:
     *     summary: List all subjects for the authenticated user
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of subjects
     */

    /**
     * @swagger
     * /api/study/subjects/{subjectId}:
     *   patch:
     *     summary: Update a subject
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: subjectId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               color:
     *                 type: string
     *     responses:
     *       200:
     *         description: Subject updated
     *       404:
     *         description: Subject not found
     *
     *   delete:
     *     summary: Delete a subject
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: subjectId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Subject deleted
     *       404:
     *         description: Subject not found
     */

    /**
     * @swagger
     * /api/study/sessions:
     *   post:
     *     summary: Log a study session
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - subjectId
     *               - durationMins
     *             properties:
     *               subjectId:
     *                 type: string
     *                 format: uuid
     *               durationMins:
     *                 type: integer
     *                 example: 45
     *               startedAt:
     *                 type: string
     *                 format: date-time
     *                 example: "2025-01-01T10:00:00Z"
     *     responses:
     *       201:
     *         description: Study session logged
     *       400:
     *         description: Invalid input
     *
     *   get:
     *     summary: List study sessions for the user
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: from
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: to
     *         schema:
     *           type: string
     *           format: date-time
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: List of study sessions
     */

    /**
     * @swagger
     * /api/study/dashboard:
     *   get:
     *     summary: Get study dashboard (subjects, totals, stats)
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: from
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: to
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Dashboard data
     */

    /**
     * @swagger
     * /api/study/stats/weekly-goal:
     *   patch:
     *     summary: Update weekly study goal
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - weeklyGoalMins
     *             properties:
     *               weeklyGoalMins:
     *                 type: integer
     *                 example: 600
     *     responses:
     *       200:
     *         description: Weekly goal updated
     *       400:
     *         description: Invalid input
     */

    return router;
};
