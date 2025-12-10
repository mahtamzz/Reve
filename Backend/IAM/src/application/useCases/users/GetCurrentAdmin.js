const adminRepo = require("../../../infrastructure/repositories/AdminRepository");

class GetCurrentAdmin {
    async execute(adminId) {
        const admin = await adminRepo.findById(adminId);
        if (!admin) throw new Error("Admin not found");
        return admin;
    }
}

module.exports = new GetCurrentAdmin();
