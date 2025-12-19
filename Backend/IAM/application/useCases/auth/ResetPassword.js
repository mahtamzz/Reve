const bcrypt = require("bcrypt");
const redis = require("../../../infrastructure/db/redis");
const userRepo = require("../../../infrastructure/repositories/UserRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");

class ResetPassword {
    async execute({ email, otp, newPassword }) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const storedOtp = await redis.get(`reset:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const hashed = await bcrypt.hash(newPassword, 10);
        const user = await userRepo.updatePassword(email, hashed);

        await redis.del(`reset:${email}`);

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

module.exports = new ResetPassword();
