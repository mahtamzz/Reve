class CreateUserProfile {
    constructor(profileRepo, prefsRepo, auditRepo) {
        this.profileRepo = profileRepo;
        this.prefsRepo = prefsRepo;
        this.auditRepo = auditRepo;
    }

    async execute(event, meta = {}) {
        const { uid, displayName, timezone } = event;

        if (!uid) {
            throw new Error("user.created event missing uid");
        }

        const existing = await this.profileRepo.findByUid(uid);
        if (existing) {
            return {
                status: "skipped",
                reason: "profile_already_exists",
                uid
            };
        }

        // Create profile
        await this.profileRepo.create({
            uid,
            displayName: displayName ?? null,
            timezone: timezone ?? "UTC"
        });

        // Default preferences
        await this.prefsRepo.upsert(uid, {
            isProfilePublic: true,
            showStreak: true
        });

        // Audit trail (event-based)
        await this.auditRepo.log(uid, "PROFILE_CREATED", {
            source: "event:user.created",
            eventId: meta.eventId ?? null
        });

        return {
            status: "created",
            uid
        };
    }
}

module.exports = CreateUserProfile;
