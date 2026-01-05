const canGroupAdminister = require("../../policies/canGroupAdminister");

class KickMember {
    constructor(groupMemberRepo, auditRepo, eventBus) {
        this.groupMemberRepo = groupMemberRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ actor, targetUid, groupId, reason = null }) {
        // If actor is a normal user, enforce group membership + role
        let actorRole = null;

        if (actor.role !== "admin") {
            actorRole = await this.groupMemberRepo.getRole(groupId, actor.uid);
            if (!actorRole) throw new Error("Not a member");
        }

        if (!canGroupAdminister({ actor, actorRole })) {
            throw new Error("Insufficient permissions");
        }

        const targetRole = await this.groupMemberRepo.getRole(groupId, targetUid);
        if (!targetRole) throw new Error("Target not a member");

        // Keep stricter rules for group-admins; platform admins bypass
        if (actor.role !== "admin") {
            if (targetRole === "owner") throw new Error("Cannot kick owner");
            if (actorRole === "admin" && targetRole === "admin") {
                throw new Error("Admin cannot kick another admin");
            }
        }

        await this.groupMemberRepo.removeMember(groupId, targetUid);

        await this.auditRepo.log({
            groupId,
            actorUid: actor.uid ?? null, // <-- requires actor_uid nullable for platform admins
            action: "member.kicked",
            targetUid,
            metadata: {
                platform_admin: actor.role === "admin",
                admin_id: actor.adminId ?? null,
                reason
            }
        });

        await this.eventBus.publish("group.member.removed", {
            groupId,
            uid: parseInt(targetUid, 10),
            at: new Date().toISOString(),
            reason: "kicked"
        });
    }
}

module.exports = KickMember;
