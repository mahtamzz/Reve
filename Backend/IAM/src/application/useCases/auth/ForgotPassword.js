const redis = require("../../../infrastructure/db/redis");
const userRepo = require("../../../infrastructure/repositories/UserRepository");
const EmailService = require("../../../infrastructure/mail/EmailService");

class ForgotPassword {
    async execute({ email }) {
        const user = await userRepo.findByEmail(email);
        if (!user) throw new Error("User not found or not verified");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redis.set(`reset:${email}`, otp, { EX: 600 });
        await EmailService.send(email, "Password Reset OTP", otp);

        return { message: "Password reset OTP sent" };
    }
}

module.exports = new ForgotPassword();
