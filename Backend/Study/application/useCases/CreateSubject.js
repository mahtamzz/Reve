class CreateSubject {
    constructor(subjectRepo, auditRepo) {
        this.subjectRepo = subjectRepo;
        this.auditRepo = auditRepo;
    }

    async execute(ownerUid, name, color = null) {
        if (!name || typeof name !== 'string') throw new Error('name is required');

        const subject = await this.subjectRepo.create(ownerUid, name.trim(), color);

        if (!subject) {
            const err = new Error('Subject name already exists');
            err.code = 'SUBJECT_NAME_EXISTS';
            throw err;
        }

        return subject;
    }
}

module.exports = CreateSubject;
