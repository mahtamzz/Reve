const userRepo = require("../../../infrastructure/repositories/UserRepository");

class GetCurrentUser {
    async execute(userId) {
        const user = await userRepo.findById(userId);
        if (!user) throw new Error("User not found");
        return user;
    }
}

module.exports = new GetCurrentUser();
