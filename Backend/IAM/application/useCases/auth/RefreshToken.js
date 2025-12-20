class RefreshToken {
    constructor(jwtService, userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    async execute(refreshToken) {
        if (!refreshToken) {
            throw new Error("No refresh token provided");
        }

        let payload;
        try {
            payload = this.jwtService.verifyRefresh(refreshToken);
        } catch (err) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await this.userRepository.findById(payload.uid);
        if (!user) {
            throw new Error("User not found");
        }

        const newAccessToken = this.jwtService.generate({
            uid: user.id,
            username: user.username,
            role: "user"
        });

        const newRefreshToken = this.jwtService.generateRefreshToken({
            uid: user.id,
            username: user.username,
            role: "user"
        });

        return {
            user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }
}

module.exports = RefreshToken;
