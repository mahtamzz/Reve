class UserDailyStudyRepository {
    upsert(uid, date, minutes) {
        throw new Error('Not implemented');
    }

    findByUidAndDate(uid, date) {
        throw new Error('Not implemented');
    }

    findRange(uid, from, to) {
        throw new Error('Not implemented');
    }
}

module.exports = UserDailyStudyRepository;