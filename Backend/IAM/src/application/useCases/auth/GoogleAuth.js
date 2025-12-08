const userRepo = require("../../../infrastructure/repositories/UserRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");

class GoogleAuth {
    async execute(profile) {
        const existing = await userRepo.findByGoogleIdOrEmail(
            profile.id,
            profile.emails[0].value
        );

        let user = existing;

        if (!user) {
            const username =
                (profile.displayName ||
                    profile.emails[0].value.split("@")[0]) +
                Math.floor(Math.random() * 10000);

            user = await userRepo.createGoogleUser({
                googleid: profile.id,
                email: profile.emails[0].value,
                username,
            });
        }

        const token = JwtService.generate({
            user_id: user.id,
            username: user.username,
        });

        return { user, token };
    }
}

module.exports = new GoogleAuth();
