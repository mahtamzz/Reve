class ListStudySessions {
    constructor(sessionRepo) {
        this.sessionRepo = sessionRepo;
    }

    async execute(uid, opts = {}) {
        return this.sessionRepo.listByUser(uid, opts);
    }
}

module.exports = ListStudySessions;
