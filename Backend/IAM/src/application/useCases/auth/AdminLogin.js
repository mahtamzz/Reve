const bcrypt = require("bcrypt");
const AdminRepository = require("../../../infrastructure/repositories/AdminRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");

class AdminLogin {
    async execute({ email, password }) {
        const admin = await AdminRepository.findByEmail(email);
        if (!admin) throw new Error("Invalid credentials");

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) throw new Error("Invalid credentials");

        const accessToken = JwtService.generate({
            admin_id: admin.id,
            username: admin.username,
            role: "admin",
        });

        const refreshToken = JwtService.generateRefreshToken({
            admin_id: admin.id,
            username: admin.username,
            role: "admin",
        });

        return { admin, accessToken, refreshToken };
    }
}

module.exports = new AdminLogin();
