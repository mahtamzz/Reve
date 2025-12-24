class DeleteSubject {
    constructor(subjectRepo, auditRepo) {
        this.subjectRepo = subjectRepo;
        this.auditRepo = auditRepo;
    }

    async execute(ownerUid, subjectId) {
        if (!subjectId) throw new Error('subjectId is required');

        // Make sure it exists + is owned by the user
        const subject = await this.subjectRepo.findById(subjectId, ownerUid);
        if (!subject) return false;

        // ✅ audit BEFORE delete so FK passes
        await this.auditRepo.log({
            uid: ownerUid,
            action: 'subject.deleted',
            subjectId: subjectId,
            metadata: { name: subject.name }
        });

        const ok = await this.subjectRepo.delete(subjectId, ownerUid);
        return ok;
    }
}

module.exports = DeleteSubject;
