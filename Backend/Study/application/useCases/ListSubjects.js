class ListSubjects {
    constructor(subjectRepo) {
        this.subjectRepo = subjectRepo;
    }

    async execute(ownerUid) {
        return this.subjectRepo.listByOwner(ownerUid);
    }
}

module.exports = ListSubjects;
