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
 *     summary: Update profile info
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       204:
 *         description: Updated successfully
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       204:
 *         description: Preferences updated
 */