class VerifyLoginOtp {
    constructor({ userRepo, cache, tokenService }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
    }

    async execute({ email, otp }) {
        const storedOtp = await this.cache.get(`login_otp:${email}`);
        if (!storedOtp) throw new Error("OTP expired or not found");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("User not found");

        await this.cache.del(`login_otp:${email}`);

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

module.exports = VerifyLoginOtp;
