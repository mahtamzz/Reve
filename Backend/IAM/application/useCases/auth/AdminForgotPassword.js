const redis = require("../../../infrastructure/db/redis");
const adminRepo = require("../../../infrastructure/repositories/AdminRepository");
const EmailService = require("../../../infrastructure/mail/EmailService");

class AdminForgotPassword {
    async execute({ email }) {
        const admin = await adminRepo.findByEmail(email);
        if (!admin) throw new Error("Admin not found");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redis.set(`reset_admin:${email}`, otp, { EX: 600 });
        await EmailService.send(email, "Admin Password Reset OTP", otp);

        return { message: "Password reset OTP sent to admin" };
    }
}

module.exports = new AdminForgotPassword();
