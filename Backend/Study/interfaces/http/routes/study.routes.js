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

    router.get("/presence", auth, requireUser, controller.presenceHandler);

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

    /**
     * @swagger
     * /api/study/presence:
     *   get:
     *     summary: Get study presence + today's base minutes for a list of users
     *     description: >
     *       Returns whether each user is currently studying (online) and the base minutes
     *       already persisted for today (UTC). If a user is currently studying, the frontend
     *       should add live minutes using (now - startedAt) on top of todayMinsBase.
     *     tags: [Study]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: uids
     *         required: true
     *         schema:
     *           type: string
     *         description: Comma-separated list of user IDs
     *         example: "12,15,20"
     *     responses:
     *       200:
     *         description: Presence snapshot
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 day:
     *                   type: string
     *                   format: date
     *                   example: "2026-02-05"
     *                 active:
     *                   type: object
     *                   description: Map of uid -> active meta (or null)
     *                   additionalProperties:
     *                     oneOf:
     *                       - type: "null"
     *                       - type: object
     *                         properties:
     *                           subjectId:
     *                             type: string
     *                             format: uuid
     *                             nullable: true
     *                           startedAt:
     *                             type: string
     *                             format: date-time
     *                           lastHbAt:
     *                             type: string
     *                             format: date-time
     *                           source:
     *                             type: string
     *                             example: "socket"
     *                 todayMinsBase:
     *                   type: object
     *                   description: Map of uid -> persisted minutes for today (UTC)
     *                   additionalProperties:
     *                     type: integer
     *                     example: 45
     *       400:
     *         description: Missing or invalid uids
     *       401:
     *         description: Unauthorized
     *       503:
     *         description: Presence unavailable (Redis not configured)
     */

    return router;
};
