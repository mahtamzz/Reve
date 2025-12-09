const userRepo = require("../../../infrastructure/repositories/UserRepository");
const redis = require("../../../infrastructure/db/redis");
const JwtService = require("../../../infrastructure/auth/JwtService");

class VerifyOtp {
    async execute({ email, otp }) {
        const storedOtp = await redis.get(`otp:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const pendingUser = await redis.get(`pending_user:${email}`);
        if (!pendingUser) throw new Error("No pending registration");

        const userData = JSON.parse(pendingUser);

        const user = await userRepo.create(userData);

        await redis.del(`pending_user:${email}`);
        await redis.del(`otp:${email}`);

        const token = JwtService.generate({
            user_id: user.id,
            username: user.username,
        });

        return { user, token };
    }
}

module.exports = new VerifyOtp();
