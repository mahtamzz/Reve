class ListChatInbox {
    constructor({ messageRepo, groupClient }) {
        this.messageRepo = messageRepo;
        this.groupClient = groupClient;
    }

    async execute({ uid, cookieHeader }) {
        if (!uid) throw new Error("uid is required");

        // 1) Ask Group service for user's groups
        const groups = await this.groupClient.listMyGroups({ cookieHeader });

        if (!groups || groups.length === 0) return [];

        const groupIds = groups.map((g) => g.id);

        // 2) Fetch latest message per group from chat DB
        const latest = await this.messageRepo.listLatestByGroupIds(groupIds);

        const latestByGroupId = new Map(latest.map((m) => [m.group_id, m]));

        // 3) Merge: include groups even with no messages
        const items = groups.map((g) => {
            const m = latestByGroupId.get(g.id) || null;

            return {
                group: { id: g.id, name: g.name },
                latestMessage: m
                    ? {
                        id: m.id,
                        groupId: m.group_id,
                        senderUid: m.sender_uid,
                        text: m.text,
                        createdAt: m.created_at
                    }
                    : null
            };
        });

        // 4) Sort by latest message time desc, groups with no messages last
        items.sort((a, b) => {
            const at = a.latestMessage?.createdAt
                ? new Date(a.latestMessage.createdAt).getTime()
                : -1;
            const bt = b.latestMessage?.createdAt
                ? new Date(b.latestMessage.createdAt).getTime()
                : -1;
            return bt - at;
        });

        return items;
    }
}

module.exports = ListChatInbox;
