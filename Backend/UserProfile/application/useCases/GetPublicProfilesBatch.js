class GetPublicProfilesBatch {
    constructor(profileRepo) {
        this.profileRepo = profileRepo;
    }

    async execute({ uids }) {
        return this.profileRepo.getPublicProfilesByUids(uids);
    }
}

module.exports = GetPublicProfilesBatch;
