class GetCurrentAdmin {
    constructor({ adminRepo }) {
        this.adminRepo = adminRepo;
    }

    async execute(adminId) {
        const admin = await this.adminRepo.findById(adminId);
        if (!admin) {
            throw new Error("Admin not found");
        }
        return admin;
    }
}

module.exports = GetCurrentAdmin;
