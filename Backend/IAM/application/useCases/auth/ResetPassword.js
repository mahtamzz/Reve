class ResetPassword {
    constructor({ userRepo, cache, tokenService, hasher }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
        this.hasher = hasher;
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
            user_id: user.id,
            username: user.username
        });

        const refreshToken = this.tokenService.generateRefresh({
            user_id: user.id,
            username: user.username
        });

        return { user, accessToken, refreshToken };
    }
}

module.exports = ResetPassword;
