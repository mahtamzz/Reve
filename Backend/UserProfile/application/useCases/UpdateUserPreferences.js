class UpdateUserPreferences {
    constructor(prefsRepo, auditRepo) {
        this.prefsRepo = prefsRepo;
        this.auditRepo = auditRepo;
    }

    async execute(uid, prefs) {
        await this.prefsRepo.upsert(uid, prefs);
        await this.auditRepo.log(uid, 'PREFERENCES_UPDATED', prefs);
    }
}

module.exports = UpdateUserPreferences;
