class UpdateSubject {
    constructor(subjectRepo, auditRepo) {
        this.subjectRepo = subjectRepo;
        this.auditRepo = auditRepo;
    }

    async execute(ownerUid, subjectId, fields) {
        if (!subjectId) throw new Error('subjectId is required');
        if (!fields || typeof fields !== 'object') throw new Error('fields is required');

        if (typeof fields.name === 'string') {
            fields.name = fields.name.trim();
        }

        const updated = await this.subjectRepo.update(subjectId, ownerUid, fields);
        if (!updated) return null;

        await this.auditRepo.log({
            uid: ownerUid,
            action: 'subject.updated',
            subjectId,
            metadata: { fields }
        });

        return updated;
    }
}

module.exports = UpdateSubject;
