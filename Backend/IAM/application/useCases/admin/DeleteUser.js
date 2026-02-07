class DeleteUser {
    constructor({ userRepo, refreshTokenStore, auditRepo, eventBus }) {
        this.userRepo = userRepo;
        this.refreshTokenStore = refreshTokenStore;
        this.auditRepo = auditRepo;
        this.eventBus = eventBus;
    }

    async execute({ userId, adminId }) {
        if (!userId) throw new Error("USER_ID_REQUIRED");

        const deletedUser = await this.userRepo.deleteById(userId);
        if (!deletedUser) throw new Error("USER_NOT_FOUND");

        // revoke refresh tokens
        await this.refreshTokenStore.revoke(userId);

        // emit event for other services
        await this.eventBus.publish("USER_DELETED", {
            userId: deletedUser.id
        });

        // audit
        // await this.auditRepo.log({
        //     user_id: adminId,
        //     action: "DELETE_USER",
        //     entity: "USER",
        //     entity_id: deletedUser.id
        // });

        return { message: "User deleted successfully" };
    }
}

module.exports = DeleteUser;
