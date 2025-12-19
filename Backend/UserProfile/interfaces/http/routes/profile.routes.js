const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserProfileController = require('../controllers/UserProfileController');
const profileRepo = require('../../../infrastructure/repositories/PgUserProfileRepo');
const prefsRepo = require('../../../infrastructure/repositories/PgPreferencesRepo');
const dailyRepo = require('../../../infrastructure/repositories/PgUserDSTRepo');
const auditRepo = require('../../../infrastructure/repositories/PgAuditRepo');

const GetUserProfile = require('../../../application/useCases/GetUserProfile');
const UpdateUserProfile = require('../../../application/useCases/UpdateUserProfile');
const UpdateUserPreferences = require('../../../application/useCases/UpdateUserPreferences');
const GetDashboard = require('../../../application/useCases/GetDashboard');

const controller = new UserProfileController({
    getProfile: new GetUserProfile(profileRepo, prefsRepo),
    updateProfile: new UpdateUserProfile(profileRepo, auditRepo),
    updatePreferences: new UpdateUserPreferences(prefsRepo, auditRepo),
    getDashboard: new GetDashboard(profileRepo, dailyRepo)
});

const router = express.Router();

router.get('/me', authMiddleware, controller.getMe);
router.get('/dashboard', authMiddleware, controller.dashboard);
router.patch('/me', authMiddleware, controller.updateProfileInfo);
router.patch('/preferences', authMiddleware, controller.updatePreferencesInfo);

module.exports = router;



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
