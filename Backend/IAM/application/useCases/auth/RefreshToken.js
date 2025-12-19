const JwtService = require("../../../infrastructure/auth/JwtService");
const userRepo = require("../../../infrastructure/repositories/UserRepository");

class RefreshToken {
    async execute(refreshToken) {
        if (!refreshToken) throw new Error("No refresh token provided");

        let payload;
        try {
            payload = JwtService.verifyRefresh(refreshToken);
        } catch (err) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await userRepo.findById(payload.user_id);
        if (!user) throw new Error("User not found");

        const newAccessToken = JwtService.generate({
            user_id: user.id,
            username: user.username
        });

        const newRefreshToken = JwtService.generateRefreshToken({
            user_id: user.id,
            username: user.username
        });

        return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
}

module.exports = new RefreshToken();
