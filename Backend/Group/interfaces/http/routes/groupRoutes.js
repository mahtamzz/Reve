const express = require("express");

module.exports = function createGroupRoutes({ controller, auth, requireUser, requireAdmin }) {
   const router = express.Router();

   /* ADMIN */
   router.get("/admin/groups", auth, requireAdmin, controller.adminList);

   /* USER */
   router.post("/", auth, requireUser, controller.create);

   router.get("/", auth, requireUser, controller.list);
   router.get("/me", auth, requireUser, controller.listMyGroups);
   router.get("/search", auth, requireUser, controller.search);

   router.get("/:groupId", auth, controller.getDetails);
   router.delete("/:groupId", auth, controller.remove);

   router.patch("/:groupId", auth, requireUser, controller.update);

   router.post("/:groupId/join", auth, requireUser, controller.join);
   router.post("/:groupId/leave", auth, requireUser, controller.leave);

   router.get("/:groupId/requests", auth, controller.listJoinRequests);
   router.post("/:groupId/requests/:userId/approve", auth, requireUser, controller.approveJoin);
   router.post("/:groupId/requests/:userId/reject", auth, requireUser, controller.rejectJoin);

   router.patch("/:groupId/members/:userId/role", auth, requireUser, controller.changeRole);
   router.delete("/:groupId/members/:userId", auth, controller.kick);

   router.get("/:groupId/members", auth, controller.listMembers);
   router.get("/:groupId/members/me", auth, requireUser, controller.getMyMembership);

   /**
    * @swagger
    * tags:
    *   name: Groups
    *   description: Group management and membership
    */

   /**
    * @swagger
    * /api/groups/admin/groups:
    *   get:
    *     summary: Admin - List all groups
    *     description: >
    *       Platform admin endpoint. Returns a paginated list of ALL groups (not just discoverable/public).
    *       Requires an admin JWT (role=admin).
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
    *           maximum: 200
    *           default: 20
    *       - in: query
    *         name: offset
    *         required: false
    *         schema:
    *           type: integer
    *           minimum: 0
    *           default: 0
    *     responses:
    *       200:
    *         description: List of groups
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 type: object
    *       401:
    *         description: Unauthorized (missing/invalid token)
    *       403:
    *         description: Forbidden (admin token required)
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
    *     description: >
    *       Returns group details.
    *       - Public groups: any authenticated user can view.
    *       - Private/invite-only groups: members can view.
    *       - Platform admins (role=admin) can view any group regardless of visibility.
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         schema:
    *           type: string
    *           format: uuid
    *     responses:
    *       200:
    *         description: Group details
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden (not a member of a non-public group)
    *       404:
    *         description: Group not found
    */


   /**
    * @swagger
    * /api/groups/{groupId}:
    *   delete:
    *     summary: Delete a group
    *     description: >
    *       Deletes a group.
    *       Allowed for:
    *       - The group owner (user token), OR
    *       - Platform admin (role=admin).
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         schema:
    *           type: string
    *           format: uuid
    *     responses:
    *       204:
    *         description: Group deleted
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden (not owner/admin)
    *       404:
    *         description: Group not found
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
    *     summary: Remove a member from the group (kick)
    *     description: >
    *       Removes a member from the group.
    *       Allowed for:
    *       - Group owner/admin (based on group_members.role), OR
    *       - Platform admin (role=admin).
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         schema:
    *           type: string
    *           format: uuid
    *       - in: path
    *         name: userId
    *         required: true
    *         schema:
    *           type: integer
    *     responses:
    *       204:
    *         description: Member removed
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden (not allowed)
    *       404:
    *         description: Group not found / Target not a member
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

   /**
    * @swagger
    * /api/groups/me:
    *   get:
    *     summary: List groups the current user belongs to
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     responses:
    *       200:
    *         description: Groups the user is a member of
    *         content:
    *           application/json:
    *             schema:
    *               type: array
    *               items:
    *                 type: object
    *       401:
    *         description: Unauthorized
    */

   /**
    * @swagger
    * /api/groups/{groupId}/requests:
    *   get:
    *     summary: List pending join requests for a group
    *     description: >
    *       Returns pending join requests for the given group.
    *       Allowed for:
    *       - Group owner/admin (based on group_members.role), OR
    *       - Platform admin (role=admin).
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         schema:
    *           type: string
    *           format: uuid
    *     responses:
    *       200:
    *         description: Pending join requests
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden (not allowed)
    *       404:
    *         description: Group not found
    */

   /**
    * @swagger
    * /api/groups/{groupId}/members:
    *   get:
    *     summary: List group members (with profile info)
    *     description: >
    *       Returns group members along with basic public profile fields from the UserProfile service.
    *       Access rules:
    *       - Public group: any authenticated user can view.
    *       - Private/invite-only: only members can view.
    *       - Platform admin (role=admin) can view any group regardless of visibility.
    *     tags: [Groups]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: path
    *         name: groupId
    *         required: true
    *         schema:
    *           type: string
    *           format: uuid
    *     responses:
    *       200:
    *         description: Group members
    *       401:
    *         description: Unauthorized
    *       403:
    *         description: Forbidden (not allowed by visibility rules)
    *       404:
    *         description: Group not found
    */

   return router;
};
