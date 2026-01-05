const express = require("express");

module.exports = function createProfileRouter({ auth, requireUser, requireAdmin, audit, controller }) {
    const router = express.Router();

    router.get("/me", auth, requireUser, controller.getMe);
    router.get("/dashboard", auth, requireUser, controller.dashboard);

    router.patch("/me", auth, requireUser, audit("profile.updated"), controller.updateProfileInfo);
    router.patch("/preferences", auth, requireUser, audit("preferences.updated"), controller.updatePreferencesInfo);

    router.patch("/me/password", auth, requireUser, audit("password.changed"), controller.changePassword);

    router.post("/public/batch", auth, requireUser, controller.getPublicProfilesBatchHandler);

    // FOLLOW GRAPH
    router.post("/:uid/follow", auth, requireUser, controller.follow);
    router.delete("/:uid/follow", auth, requireUser, controller.unfollow);

    router.get("/:uid/followers", auth, requireUser, controller.followers);
    router.get("/:uid/following", auth, requireUser, controller.following);

    // OPTIONAL helpers
    router.get("/:uid/follow-status", auth, requireUser, controller.followStatus);
    router.get("/:uid/follow-counts", auth, requireUser, controller.followCounts);

    return router;
};




/**
 * @swagger
 * /api/profile/me:
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
 * /api/profile/dashboard:
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
 * /api/profile/me:
 *   patch:
 *     summary: Update user profile info
 *     description: |
 *       Updates profile fields and/or IAM fields.
 *       - `username` updates IAM username and also syncs `display_name` in profile DB.
 *       - `password` updates IAM password (not stored in profile DB).
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               username:
 *                 type: string
 *                 example: "new_username"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: New password (write-only)
 *                 example: "Str0ngPassw0rd!"
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
 *     responses:
 *       204:
 *         description: Updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/profile/preferences:
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

/**
 * @swagger
 * /api/profile/me/password:
 *   patch:
 *     summary: Change current user's password
 *     description: Verifies current password via IAM and updates to a new password.
 *     tags: [Profile]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             additionalProperties: false
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 example: "OldPassw0rd!"
 *               new_password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewStr0ngPassw0rd!"
 *     responses:
 *       204: { description: Password updated }
 *       403: { description: Current password incorrect }
 *       401: { description: Unauthorized }
 */
/**
 * @swagger
 * /api/profile/{uid}/follow:
 *   post:
 *     summary: Follow a user
 *     description: Create a follow relationship from the current user to the target user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *         description: UID of the user to follow
 *     responses:
 *       200:
 *         description: Followed successfully or already following
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [followed, skipped]
 *                 reason:
 *                   type: string
 *                   nullable: true
 *                   example: already_following
 *       400:
 *         description: Invalid UID or self-follow attempt
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Target user not found
 */
/**
 * @swagger
 * /api/profile/{uid}/follow:
 *   delete:
 *     summary: Unfollow a user
 *     description: Remove a follow relationship from the current user to the target user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *         description: UID of the user to unfollow
 *     responses:
 *       200:
 *         description: Unfollowed successfully or not following
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unfollowed, skipped]
 *                 reason:
 *                   type: string
 *                   nullable: true
 *                   example: not_following
 *       400:
 *         description: Invalid UID or self-unfollow attempt
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/profile/{uid}/followers:
 *   get:
 *     summary: List followers of a user
 *     description: |
 *       Returns users who follow the given user.
 *       By default, returns public profile data.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *         description: UID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: includeProfiles
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to return public profile data or only UIDs
 *     responses:
 *       200:
 *         description: List of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - type: integer
 *                       - type: object
 *                         properties:
 *                           uid:
 *                             type: integer
 *                           display_name:
 *                             type: string
 *                             nullable: true
 *                           avatar_media_id:
 *                             type: string
 *                             nullable: true
 *                 paging:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       400:
 *         description: Invalid UID
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/profile/{uid}/following:
 *   get:
 *     summary: List users followed by a user
 *     description: |
 *       Returns users that the given user is following.
 *       By default, returns public profile data.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *         description: UID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: includeProfiles
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - type: integer
 *                       - type: object
 *                         properties:
 *                           uid:
 *                             type: integer
 *                           display_name:
 *                             type: string
 *                             nullable: true
 *                           avatar_media_id:
 *                             type: string
 *                             nullable: true
 *                 paging:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       400:
 *         description: Invalid UID
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/profile/{uid}/follow-status:
 *   get:
 *     summary: Check follow status
 *     description: Determine whether the current user follows the given user.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *         description: UID of the target user
 *     responses:
 *       200:
 *         description: Follow status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 *       400:
 *         description: Invalid UID
 *       401:
 *         description: Unauthorized
 */
/**
 * @swagger
 * /api/profile/{uid}/follow-counts:
 *   get:
 *     summary: Get follower and following counts
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Follow counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: integer
 *                 followers:
 *                   type: integer
 *                 following:
 *                   type: integer
 *       400:
 *         description: Invalid UID
 *       401:
 *         description: Unauthorized
 */
