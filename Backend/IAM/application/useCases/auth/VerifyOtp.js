class VerifyOtp {
    constructor({ userRepo, cache, tokenService, eventBus, refreshTokenStore }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
        this.eventBus = eventBus;
        this.refreshTokenStore = refreshTokenStore;
    }

    async execute({ email, otp }) {
        const storedOtp = await this.cache.get(`otp:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const pendingUser = await this.cache.get(`pending_user:${email}`);
        if (!pendingUser) throw new Error("No pending registration");

        const userData = JSON.parse(pendingUser);
        const user = await this.userRepo.create(userData);

        // publish event
        if (!this.eventBus || typeof this.eventBus.publish !== "function") {
            throw new Error("EventBus.publish not available");
        }
        await this.eventBus.publish("user.created", {
            uid: user.id,
            email: user.email,
            username: user.username
        });

        await this.cache.del(`pending_user:${email}`);
        await this.cache.del(`otp:${email}`);

        const accessToken = this.tokenService.generate({
            uid: user.id,
            username: user.username
        });

        const refreshToken = this.tokenService.generateRefreshToken({
            uid: user.id,
            username: user.username
        });

        // ✅ STORE THE NEW jti (rotation baseline)
        const refreshPayload = this.tokenService.verifyRefresh(refreshToken);
        await this.refreshTokenStore.set(user.id, refreshPayload.jti, 7 * 24 * 60 * 60);

        return { user, accessToken, refreshToken };
    }
}

module.exports = VerifyOtp;
