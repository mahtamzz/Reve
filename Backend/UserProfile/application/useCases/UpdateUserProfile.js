const bcrypt = require("bcrypt");
const crypto = require("crypto");

class UpdateUserProfile {
    constructor(profileRepo, auditRepo, eventBus) {
        this.profileRepo = profileRepo;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute(uid, updates) {
        if (!uid) throw new Error("uid required");
        if (!updates || typeof updates !== "object") return;

        const iamChanges = {};
        const profileUpdates = {};

        // ---- IAM-owned fields ----
        if (typeof updates.username === "string") {
            const username = updates.username.trim();
            if (!username) throw new Error("username cannot be empty");

            iamChanges.username = username;
            profileUpdates.display_name = username; // keep profile in sync
        }
        // ---- Profile-owned fields (what your swagger shows) ----
        const displayName =
            typeof updates.display_name === "string" ? updates.display_name :
                typeof updates.displayName === "string" ? updates.displayName :
                    undefined;

        if (typeof displayName === "string") {
            const v = displayName.trim();
            if (!v) throw new Error("display_name cannot be empty");
            profileUpdates.display_name = v;
        }

        const avatarMediaId =
            "avatar_media_id" in updates ? updates.avatar_media_id :
                "avatarMediaId" in updates ? updates.avatarMediaId :
                    undefined;

        if (avatarMediaId !== undefined) {
            if (avatarMediaId !== null && typeof avatarMediaId !== "string") {
                throw new Error("avatar_media_id must be string or null");
            }
            profileUpdates.avatar_media_id = avatarMediaId; // allow null to clear
        }

        const weeklyGoal =
            typeof updates.weekly_goal === "number" ? updates.weekly_goal :
                typeof updates.weeklyGoal === "number" ? updates.weeklyGoal :
                    undefined;

        if (weeklyGoal !== undefined) {
            if (!Number.isInteger(weeklyGoal) || weeklyGoal < 0) {
                throw new Error("weekly_goal must be a non-negative integer");
            }
            profileUpdates.weekly_goal = weeklyGoal;
        }

        const timezone =
            typeof updates.timezone === "string" ? updates.timezone :
                undefined;

        if (timezone !== undefined) {
            const v = timezone.trim();
            if (!v) throw new Error("timezone cannot be empty");
            profileUpdates.timezone = v;
        }

        // 1) Update local profile DB
        if (Object.keys(profileUpdates).length > 0) {
            await this.profileRepo.update(uid, profileUpdates);
        }

        await this.auditRepo.log({
            actorUid: uid,
            action: "PROFILE_UPDATED",
            metadata: { updates: profileUpdates, iamChanges }
        });

        // 3) Publish event to IAM if needed
        if (Object.keys(iamChanges).length > 0) {
            if (!this.eventBus || typeof this.eventBus.publish !== "function") {
                throw new Error("EventBus.publish not available in user-profile");
            }

            await this.eventBus.publish(
                "user.updated",
                {
                    uid,
                    changes: iamChanges,
                    occurredAt: new Date().toISOString(),
                    source: "user-profile-service"
                },
                { messageId: crypto.randomUUID() }
            );
        }
    }
}

module.exports = UpdateUserProfile;
