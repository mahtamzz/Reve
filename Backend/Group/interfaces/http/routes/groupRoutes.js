const express = require("express");

module.exports = function createGroupRoutes({ controller, auth }) {
    const router = express.Router();

    router.post("/", auth, controller.create);
    router.get("/:groupId", auth, controller.getDetails);
    router.delete("/:groupId", auth, controller.remove);
    router.patch("/:groupId", auth, controller.update);

    router.post("/:groupId/join", auth, controller.join);
    router.post("/:groupId/leave", auth, controller.leave);

    router.post("/:groupId/requests/:userId/approve", auth, controller.approveJoin);
    router.post("/:groupId/requests/:userId/reject", auth, controller.rejectJoin);

    router.patch("/:groupId/members/:userId/role", auth, controller.changeRole);
    router.delete("/:groupId/members/:userId", auth, controller.kick);

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

    return router;
};
