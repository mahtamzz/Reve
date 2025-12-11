const bcrypt = require("bcrypt");
const redis = require("../../../infrastructure/db/redis");
const adminRepo = require("../../../infrastructure/repositories/AdminRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");

class AdminResetPassword {
    async execute({ email, otp, newPassword }) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        // Use a separate Redis key for admins
        const storedOtp = await redis.get(`reset_admin:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const hashed = await bcrypt.hash(newPassword, 10);

        const admin = await adminRepo.updatePassword(email, hashed);

        await redis.del(`reset_admin:${email}`);

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

module.exports = new AdminResetPassword();
