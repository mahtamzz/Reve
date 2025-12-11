const userRepo = require("../../../infrastructure/repositories/UserRepository");
const redis = require("../../../infrastructure/db/redis");
const JwtService = require("../../../infrastructure/auth/JwtService");

class VerifyLoginOtp {
    async execute({ email, otp }) {
        const storedOtp = await redis.get(`login_otp:${email}`);
        if (!storedOtp) throw new Error("OTP expired or not found");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const user = await userRepo.findByEmail(email);
        if (!user) throw new Error("User not found");

        await redis.del(`login_otp:${email}`);

        const accessToken = JwtService.generate({
            user_id: user.id,
            username: user.username,
        });

        const refreshToken = JwtService.generateRefreshToken({
            user_id: user.id,
            username: user.username,
        });

        return { user, accessToken, refreshToken };
    }
}

module.exports = new VerifyLoginOtp();
