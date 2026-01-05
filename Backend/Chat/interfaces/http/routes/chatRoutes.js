const express = require("express");

module.exports = function createChatRoutes({ controller, auth, requireUser, requireAdmin, presenceStore }) {
    const router = express.Router();

    router.get("/groups/:groupId/messages", auth, requireUser, controller.listMessages);
    router.post("/groups/:groupId/messages", auth, requireUser, controller.sendMessageHttp);
    router.get("/inbox", auth, requireUser, controller.listInbox);

    router.get("/socket", (req, res) => {
        res.json({
            socketPath: "/socket.io/",
            events: {
                join: "group:join { groupId }",
                leave: "group:leave { groupId }",
                send: "message:send { groupId, text, clientMessageId? }",
                list: "messages:list { groupId, limit?, before? }",
                newMessage: "message:new (server broadcast)",
                revoked: "group:revoked (server push)",
                deleted: "group:deleted (server push)",
                presence: {
                    check: "GET /api/chat/presence?userIds=uid1,uid2,... (auth required)",
                    updateEvent: "presence:update { uid, status } (server broadcast)"
                }
            }
        });
    });

    router.get("/presence", auth, requireUser, async (req, res, next) => {
        try {
            const userIdsParam = String(req.query.userIds || "");
            const uids = userIdsParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            if (uids.length === 0) return res.json({});

            const map = await presenceStore.getOnlineMap(uids);
            res.json(map);
        } catch (err) {
            next(err);
        }
    });


    /**
     * @swagger
     * tags:
     *   name: Chat
     *   description: Group chat messaging (text-only)
     */

    /**
     * @swagger
     * /api/chat/groups/{groupId}/messages:
     *   get:
     *     summary: List messages for a group chat (newest first)
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: limit
     *         required: false
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 200
     *           default: 50
     *         description: Max number of messages to return.
     *       - in: query
     *         name: before
     *         required: false
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Cursor pagination. Return messages with created_at < before.
     *     responses:
     *       200:
     *         description: List of messages
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
     *                   group_id:
     *                     type: string
     *                     format: uuid
     *                   sender_uid:
     *                     type: integer
     *                   text:
     *                     type: string
     *                   client_message_id:
     *                     type: string
     *                     nullable: true
     *                   created_at:
     *                     type: string
     *                     format: date-time
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden (not a member)
     */

    /**
     * @swagger
     * /api/chat/groups/{groupId}/messages:
     *   post:
     *     summary: Send a message to a group chat (HTTP test endpoint)
     *     description: >
     *       Optional endpoint mainly for testing via Swagger/Postman. In the app, messages are usually sent via Socket.IO.
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: groupId
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
     *             required:
     *               - text
     *             properties:
     *               text:
     *                 type: string
     *                 example: "Hello everyone!"
     *               clientMessageId:
     *                 type: string
     *                 nullable: true
     *                 description: Client-generated id for dedupe (optional).
     *     responses:
     *       201:
     *         description: Message created
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   format: uuid
     *                 group_id:
     *                   type: string
     *                   format: uuid
     *                 sender_uid:
     *                   type: integer
     *                 text:
     *                   type: string
     *                 client_message_id:
     *                   type: string
     *                   nullable: true
     *                 created_at:
     *                   type: string
     *                   format: date-time
     *       400:
     *         description: Bad request (validation)
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Forbidden (not a member)
     */

    /**
     * @swagger
     * /api/chat/socket:
     *   get:
     *     summary: Socket.IO endpoint info (helper)
     *     tags: [Chat]
     *     responses:
     *       200:
     *         description: Information about connecting via Socket.IO
     */

    /**
     * @swagger
     * /api/chat/inbox:
     *   get:
     *     summary: List my group chats with their latest message (inbox)
     *     description: >
     *       Returns all groups the authenticated user belongs to, each paired with the latest chat message (if any).
     *       Sorted by latest message time descending. Groups with no messages appear last.
     *     tags: [Chat]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Inbox items (group summary + latest message)
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   group:
     *                     type: object
     *                     description: Minimal group info for inbox display.
     *                     properties:
     *                       id:
     *                         type: string
     *                         format: uuid
     *                       name:
     *                         type: string
     *                     required:
     *                       - id
     *                       - name
     *                   latestMessage:
     *                     type: object
     *                     nullable: true
     *                     description: Latest message in the group, or null if no messages exist yet.
     *                     properties:
     *                       id:
     *                         type: string
     *                         format: uuid
     *                       groupId:
     *                         type: string
     *                         format: uuid
     *                       senderUid:
     *                         type: integer
     *                       text:
     *                         type: string
     *                       createdAt:
     *                         type: string
     *                         format: date-time
     *             examples:
     *               sample:
     *                 value:
     *                   - group:
     *                       id: "0d2d1a2f-5a0b-4e4b-9f4d-7c1b8f7a1c11"
     *                       name: "Algorithms Study Group"
     *                     latestMessage:
     *                       id: "b31b7f8a-2f24-4d9b-9a0c-7aee7a7a2d7c"
     *                       groupId: "0d2d1a2f-5a0b-4e4b-9f4d-7c1b8f7a1c11"
     *                       senderUid: 34
     *                       text: "Are we meeting at 7?"
     *                       createdAt: "2026-01-02T19:21:00.000Z"
     *                   - group:
     *                       id: "a7b2c9d1-1111-4f4a-8888-2a2a2a2a2a2a"
     *                       name: "Empty Group"
     *                     latestMessage: null
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Server error (e.g., Group service unavailable)
     */

    return router;
};
