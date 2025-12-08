const redis = require("../../../infrastructure/db/redis");
const EmailService = require("../../../infrastructure/mail/EmailService");

class ResendOtp {
    async execute({ email }) {
        const pendingUser = await redis.get(`pending_user:${email}`);
        if (!pendingUser) throw new Error("No registration pending for this email");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redis.set(`otp:${email}`, otp, { EX: 600 });

        await EmailService.send(email, "Your OTP", otp);

        return { message: "OTP resent to email" };
    }
}

module.exports = new ResendOtp();
