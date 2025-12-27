class ResetPassword {
    constructor({ userRepo, cache, tokenService, hasher, refreshTokenStore }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
        this.hasher = hasher;
        this.refreshTokenStore = refreshTokenStore;
    }

    async execute({ email, otp, newPassword }) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const storedOtp = await this.cache.get(`reset:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const hashedPassword = await this.hasher.hash(newPassword);
        const user = await this.userRepo.updatePassword(email, hashedPassword);

        await this.cache.del(`reset:${email}`);

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

module.exports = ResetPassword;
