const express = require("express");

module.exports = function createGroupRoutes({ controller, auth }) {
    const router = express.Router();

    router.post("/", auth, controller.create);

    router.get("/", auth, controller.list);
    router.get("/search", auth, controller.search);

    router.get("/:groupId", auth, controller.getDetails);
    router.delete("/:groupId", auth, controller.remove);
    router.patch("/:groupId", auth, controller.update);

    router.post("/:groupId/join", auth, controller.join);
    router.post("/:groupId/leave", auth, controller.leave);

    router.post("/:groupId/requests/:userId/approve", auth, controller.approveJoin);
    router.post("/:groupId/requests/:userId/reject", auth, controller.rejectJoin);

    router.patch("/:groupId/members/:userId/role", auth, controller.changeRole);
    router.delete("/:groupId/members/:userId", auth, controller.kick);

    router.get("/:groupId/members/me", auth, controller.getMyMembership);

    /**
     * @swagger
     * tags:
     *   name: Groups
     *   description: Group management and membership
     */

    /**
     * @swagger
     * /api/groups:
     *   post:
     *     summary: Create a new group
     *     tags: [Groups]
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
     *               description:
     *                 type: string
     *               weeklyXp:
     *                 type: integer
     *               minimum_dst_mins:
     *                 type: integer
     *     responses:
     *       201:
     *         description: Group created
     */

    /**
     * @swagger
     * /api/groups/{groupId}:
     *   get:
     *     summary: Get group details
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Group details
     */

    /**
     * @swagger
     * /api/groups/{groupId}:
     *   delete:
     *     summary: Delete a group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Group deleted
     */

    /**
     * @swagger
     * /api/groups/{groupId}:
     *   patch:
     *     summary: Update group details
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Group updated
     */

    /**
     * @swagger
     * /api/groups/{groupId}/join:
     *   post:
     *     summary: Join a group or request to join
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Joined or request created
     */

    /**
     * @swagger
     * /api/groups/{groupId}/leave:
     *   post:
     *     summary: Leave a group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Left group
     */

    /**
     * @swagger
     * /api/groups/{groupId}/requests/{userId}/approve:
     *   post:
     *     summary: Approve a join request
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Join request approved
     */

    /**
     * @swagger
     * /api/groups/{groupId}/requests/{userId}/reject:
     *   post:
     *     summary: Reject a join request
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Join request rejected
     */

    /**
     * @swagger
     * /api/groups/{groupId}/members/{userId}/role:
     *   patch:
     *     summary: Change a member's role
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - role
     *             properties:
     *               role:
     *                 type: string
     *                 enum: [member, admin]
     *     responses:
     *       204:
     *         description: Role updated
     */

    /**
     * @swagger
     * /api/groups/{groupId}/members/{userId}:
     *   delete:
     *     summary: Kick a member from the group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Member removed
     */
    /**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: List discoverable groups
 *     description: >
 *       Returns a paginated list of groups that can be discovered in the app.
 *       Depending on product rules, this may include public and private groups but returns only summary fields.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Max number of groups to return.
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of groups to skip (pagination).
 *     responses:
 *       200:
 *         description: A list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                     nullable: true
 *                   visibility:
 *                     type: string
 *                     enum: [public, private, invite_only]
 *                   weekly_xp:
 *                     type: integer
 *                   minimum_dst_mins:
 *                     type: integer
 *                     nullable: true
 *                   owner_uid:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
    /**
     * @swagger
     * /api/groups/search:
     *   get:
     *     summary: Search discoverable groups
     *     description: >
     *       Searches groups by matching the query against group name and description.
     *       Returns a paginated list of group summaries.
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: q
     *         required: true
     *         schema:
     *           type: string
     *           minLength: 1
     *         description: Search query text.
     *         example: "math focus"
     *       - in: query
     *         name: limit
     *         required: false
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 20
     *         description: Max number of groups to return.
     *       - in: query
     *         name: offset
     *         required: false
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 0
     *         description: Number of groups to skip (pagination).
     *     responses:
     *       200:
     *         description: A list of matching groups
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     format: uuid
     *                   name:
     *                     type: string
     *                   description:
     *                     type: string
     *                     nullable: true
     *                   visibility:
     *                     type: string
     *                     enum: [public, private, invite_only]
     *                   weekly_xp:
     *                     type: integer
     *                   minimum_dst_mins:
     *                     type: integer
     *                     nullable: true
     *                   owner_uid:
     *                     type: integer
     *                   created_at:
     *                     type: string
     *                     format: date-time
     *                   updated_at:
     *                     type: string
     *                     format: date-time
     *       400:
     *         description: Bad Request (missing or empty query)
     *       401:
     *         description: Unauthorized
     */

    /**
     * @swagger
     * /api/groups/{groupId}/members/me:
     *   get:
     *     summary: Check if the current user is a member of the group
     *     tags: [Groups]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Membership status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 groupId:
     *                   type: string
     *                 uid:
     *                   type: integer
     *                 isMember:
     *                   type: boolean
     *                 role:
     *                   type: string
     *                   nullable: true
     *       401:
     *         description: Unauthorized
     */

    return router;
};
