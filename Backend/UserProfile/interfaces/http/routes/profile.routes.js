const express = require("express");

module.exports = function createProfileRouter({
    auth, audit, controller }) {
    const router = express.Router();

    router.get("/me", auth, controller.getMe);

    router.get("/dashboard", auth, controller.dashboard);

    router.patch("/me",auth, audit('profile.updated'), controller.updateProfileInfo);

    router.patch("/preferences", auth, audit('preferences.updated'), controller.updatePreferencesInfo);

    return router;
};




/**
 * @swagger
 * tags:
 *   - name: UserProfile
 *     description: Operations related to user profiles
 */

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Get current logged-in user's profile
 *     tags: [UserProfile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                 display_name:
 *                   type: string
 *                 avatar_media_id:
 *                   type: string
 *                 weekly_goal:
 *                   type: integer
 *                 xp:
 *                   type: integer
 *                 streak:
 *                   type: integer
 *                 timezone:
 *                   type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/profile/me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [UserProfile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *               avatar_media_id:
 *                 type: string
 *               weekly_goal:
 *                 type: integer
 *               timezone:
 *                 type: string
 *     responses:
 *       204:
 *         description: Profile updated successfully
 */

/**
 * @swagger
 * /api/profile/preferences:
 *   patch:
 *     summary: Update current user's preferences
 *     tags: [UserProfile]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_profile_public:
 *                 type: boolean
 *               show_streak:
 *                 type: boolean
 *     responses:
 *       204:
 *         description: Preferences updated successfully
 */

/**
 * @swagger
 * /api/profile/dashboard:
 *   get:
 *     summary: Get current user's dashboard data
 *     tags: [UserProfile]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weekly_goal:
 *                   type: integer
 *                 streak:
 *                   type: integer
 *                 xp:
 *                   type: integer
 *                 daily_study:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       study_date:
 *                         type: string
 *                         format: date
 *                       total_duration_minutes:
 *                         type: integer
 */
