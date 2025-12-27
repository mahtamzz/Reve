// application/useCases/auth/RefreshToken.js
class RefreshToken {
    constructor(jwtService, userRepository, refreshTokenStore) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.refreshTokenStore = refreshTokenStore;
    }

    async execute(refreshToken) {
        if (!refreshToken) throw new Error("No refresh token provided");

        // 1) verify refresh JWT
        let payload;
        try {
            payload = this.jwtService.verifyRefresh(refreshToken);
        } catch {
            throw new Error("Invalid or expired refresh token");
        }

        // 2) must match current jti in redis (rotation)
        const ok = await this.refreshTokenStore.matches(payload.uid, payload.jti);
        if (!ok) {
            // Token reuse / old token
            throw new Error("Refresh token revoked");
        }

        const user = await this.userRepository.findById(payload.uid);
        if (!user) throw new Error("User not found");

        // 3) mint new tokens
        const newAccessToken = this.jwtService.generate({
            uid: user.id,
            username: user.username,
            role: "user"
        }, "15m");

        const newRefreshToken = this.jwtService.generateRefreshToken({
            uid: user.id,
            username: user.username,
            role: "user"
        }, "7d");

        // 4) rotate: store new jti (overwrites old)
        const newRefreshPayload = this.jwtService.verifyRefresh(newRefreshToken);
        await this.refreshTokenStore.set(user.id, newRefreshPayload.jti, 7 * 24 * 60 * 60);

        return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
}

module.exports = RefreshToken;
