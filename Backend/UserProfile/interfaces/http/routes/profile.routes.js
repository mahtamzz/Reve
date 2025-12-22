const express = require("express");

module.exports = function createProfileRouter({
    auth, audit, controller }) {
    const router = express.Router();

    router.get("/me", auth, controller.getMe);

    router.get("/dashboard", auth, controller.dashboard);

    router.patch("/me", auth, audit('profile.updated'), controller.updateProfileInfo);

    router.patch("/preferences", auth, audit('preferences.updated'), controller.updatePreferencesInfo);

    return router;
};



/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 */
/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get user dashboard
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
/**
 * @swagger
 * /me:
 *   patch:
 *     summary: Update user profile info
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Fields to update in the user profile
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 example: "New Name"
 *               avatar_media_id:
 *                 type: string
 *                 nullable: true
 *                 example: "abc123"
 *               weekly_goal:
 *                 type: integer
 *                 example: 150
 *               timezone:
 *                 type: string
 *                 example: "UTC"
 *             additionalProperties: false
 *     responses:
 *       204:
 *         description: Profile updated successfully
 */

/**
 * @swagger
 * /preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Fields to update in user preferences
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_subject_public:
 *                 type: boolean
 *                 example: true
 *             additionalProperties: false
 *     responses:
 *       204:
 *         description: Preferences updated successfully
 */
