class UserPreferencesRepository {
    findByUid(uid) {
        throw new Error('Not implemented');
    }

    upsert(uid, prefs) {
        throw new Error('Not implemented');
    }
}

module.exports = UserPreferencesRepository;