class ChangePassword {
    constructor({ userRepo, hasher }) {
        this.userRepo = userRepo;
        this.hasher = hasher;
    }

    async execute({ uid, current_password, new_password }) {
        if (!uid) throw new Error("uid required");
        if (typeof current_password !== "string" || typeof new_password !== "string") {
            throw new Error("current_password and new_password required");
        }
        if (new_password.length < 8) throw new Error("new_password must be at least 8 characters");

        // Need password hash
        const user = await this.userRepo.findAuthById(uid);
        if (!user) throw new Error("User not found");

        const ok = await this.hasher.compare(current_password, user.password);
        if (!ok) throw new Error("CURRENT_PASSWORD_INCORRECT");

        const newHash = await this.hasher.hash(new_password);
        await this.userRepo.updatePasswordHashById(uid, newHash);
    }
}

module.exports = ChangePassword;
