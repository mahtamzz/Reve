class UpdateUserPreferences {
    constructor(prefsRepo, auditRepo) {
        this.prefsRepo = prefsRepo;
        this.auditRepo = auditRepo;
    }

    async execute(uid, prefs) {
        await this.prefsRepo.upsert(uid, prefs);
        // Wrap arguments in an object
        await this.auditRepo.log({ 
            actorUid: uid, 
            action: 'PREFERENCES_UPDATED', 
            metadata: prefs 
        });
    }
}

module.exports = UpdateUserPreferences;
