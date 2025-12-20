class GoogleAuth {
    constructor(userRepository, jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    async execute(profile) {
        let user = await this.userRepository.findByGoogleIdOrEmail(
            profile.id,
            profile.emails[0].value
        );

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

        return { user, accessToken, refreshToken };
    }
}

module.exports = GoogleAuth;
