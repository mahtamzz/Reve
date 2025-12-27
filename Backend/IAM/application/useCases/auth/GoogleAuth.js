class GoogleAuth {
    constructor({ userRepository, jwtService, eventBus, refreshTokenStore }) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.eventBus = eventBus;
        this.refreshTokenStore = refreshTokenStore;
    }

    async execute(profile) {
        let user = await this.userRepository.findByGoogleIdOrEmail(
            profile.id,
            profile.emails[0].value
        );

        let isNewUser = false;

        if (!user) {
            const username =
                (profile.displayName ||
                    profile.emails[0].value.split("@")[0]) +
                Math.floor(Math.random() * 10000);

            user = await this.userRepository.createGoogleUser({
                googleid: profile.id,
                email: profile.emails[0].value,
                username,
            });

            isNewUser = true;
        }

        if (isNewUser) {
            if (!this.eventBus || typeof this.eventBus.publish !== "function") {
                throw new Error("EventBus.publish not available");
            }
            await this.eventBus.publish("user.created", {
                uid: user.id,
                email: user.email,
                username: user.username
            });
        }

        const accessToken = this.jwtService.generate({
            uid: user.id,
            username: user.username,
            role: "user"
        });

        const refreshToken = this.jwtService.generateRefreshToken({
            uid: user.id,
            username: user.username,
            role: "user"
        });

        // ✅ STORE THE NEW jti (rotation baseline)
        const refreshPayload = this.tokenService.verifyRefresh(refreshToken);
        await this.refreshTokenStore.set(user.id, refreshPayload.jti, 7 * 24 * 60 * 60);

        return { user, accessToken, refreshToken };
    }
}

module.exports = GoogleAuth;
