function createChatController({ listGroupMessages, sendGroupMessage, groupClient }) {
    return {
        async listMessages(req, res, next) {
            try {
                const groupId = req.params.groupId;
                const uid = req.user.uid;

                // verify membership once for REST call
                const cookieHeader = req.headers.cookie || "";
                const membership = await groupClient.getMyMembership({ groupId, cookieHeader });
                if (!membership.isMember) {
                    return res.status(403).json({ error: "Not a member" });
                }

                const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
                const before = req.query.before || null;

                const messages = await listGroupMessages.execute({ groupId, uid, limit, before });
                res.json(messages);
            } catch (err) {
                next(err);
            }
        },

        async sendMessageHttp(req, res, next) {
            try {
                const groupId = req.params.groupId;
                const uid = req.user.uid;

                // verify membership once for REST call
                const cookieHeader = req.headers.cookie || "";
                const membership = await groupClient.getMyMembership({ groupId, cookieHeader });
                if (!membership.isMember) {
                    return res.status(403).json({ error: "Not a member" });
                }

                const { text, clientMessageId } = req.body;

                const msg = await sendGroupMessage.execute({
                    groupId,
                    senderUid: uid,
                    text,
                    clientMessageId: clientMessageId || null
                });

                res.status(201).json(msg);
            } catch (err) {
                next(err);
            }
        }
    };
}

module.exports = createChatController;
