class ListGroupMembers {
    constructor(groupRepo, groupMemberRepo, userProfileClient) {
        this.groupRepo = groupRepo;
        this.groupMemberRepo = groupMemberRepo;
        this.userProfileClient = userProfileClient;
    }

    async execute({ actor, groupId, authHeader }) {
        const group = await this.groupRepo.findById(groupId);
        if (!group) throw new Error("Group not found");

        if (actor.role !== "admin") {
            if (group.visibility !== "public") {
                const role = await this.groupMemberRepo.getRole(groupId, actor.uid);
                if (!role) throw new Error("Not a member");
            }
        }

        const members = await this.groupMemberRepo.getMembers(groupId);
        const uids = members.map(m => m.uid);

        let profiles = [];
        try {
            profiles = await this.userProfileClient.getPublicProfilesBatch(authHeader, uids);
        } catch (e) {
            profiles = [];
        }

        const byUid = new Map(profiles.map(p => [p.uid, p]));

        return {
            groupId,
            total: members.length,
            items: members.map(m => {
                const p = byUid.get(m.uid);
                return {
                    uid: m.uid,
                    role: m.role,
                    joined_at: m.joined_at,
                    profile: p
                        ? { display_name: p.display_name ?? null, timezone: p.timezone ?? null }
                        : null
                };
            })
        };
    }
}

module.exports = ListGroupMembers;
