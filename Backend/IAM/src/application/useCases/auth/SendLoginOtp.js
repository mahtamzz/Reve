const userRepo = require("../../../infrastructure/repositories/UserRepository");
const redis = require("../../../infrastructure/db/redis");
const EmailService = require("../../../infrastructure/mail/EmailService");

class SendLoginOtp {
    async execute({ email }) {
        const user = await userRepo.findByEmail(email);
        if (!user) throw new Error("User not found");

        // generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // store OTP with 2 minutes TTL
        await redis.set(`login_otp:${email}`, otp, "EX", 120);

        await EmailService.send(email, "Your OTP", otp);

        return { message: "OTP sent successfully" };
    }
}

module.exports = new SendLoginOtp();
