class GetCurrentUser {
    constructor({ userRepo }) {
        this.userRepo = userRepo;
    }

    async execute(userId) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
}

module.exports = GetCurrentUser;
