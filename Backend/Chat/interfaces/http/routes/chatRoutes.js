const express = require("express");

module.exports = function createChatRoutes({ controller, auth }) {
    const router = express.Router();

    router.get("/groups/:groupId/messages", auth, controller.listMessages);

    router.post("/groups/:groupId/messages", auth, controller.sendMessageHttp);

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
                deleted: "group:deleted (server push)"
            }
        });
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

    return router;
};
