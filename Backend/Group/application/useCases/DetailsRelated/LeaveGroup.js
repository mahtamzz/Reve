class LeaveGroup {
    constructor(membershipRepo, groupRepo, eventBus) {
        this.membershipRepo = membershipRepo;
        this.groupRepo = groupRepo;
        this.eventBus = eventBus;
    }

    async execute({ uid, groupId }) {
        const role = await this.membershipRepo.getRole(groupId, uid);
        if (!role) throw new Error("Not a member");

        if (role === "owner") {
            throw new Error("Owner must transfer ownership before leaving");
        }

        await this.membershipRepo.removeMember(groupId, uid);

        // 🔥 publish membership removal
        await this.eventBus.publish("group.member.removed", {
            groupId,
            uid,
            at: new Date().toISOString(),
            reason: "left"
        });
    }
}

module.exports = LeaveGroup;
