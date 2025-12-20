class UserLogin {
    constructor({ userRepo, cache, tokenService, hasher }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
        this.hasher = hasher;
    }

    async execute({ email, password }) {
        const fails = Number(await this.cache.get(`login_fails:${email}`)) || 0;

        if (fails >= 5) {
            throw new Error("Too many attempts. Try again later.");
        }

        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("Invalid credentials");

        const valid = await this.hasher.compare(password, user.password);
        if (!valid) {
            await this.cache.set(`login_fails:${email}`, fails + 1, 300);
            throw new Error("Invalid credentials");
        }

        await this.cache.del(`login_fails:${email}`);

        const accessToken = this.tokenService.generate({
            uid: user.id,
            username: user.username
        });

        const refreshToken = this.tokenService.generateRefreshToken({
            uid: user.id,
            username: user.username
        });

        return { user, accessToken, refreshToken };
    }
}

module.exports = UserLogin;
