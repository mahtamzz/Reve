class VerifyLoginOtp {
    constructor({ userRepo, cache, tokenService }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.tokenService = tokenService;
    }

    async execute({ email, otp }) {
        if (!email || !otp) {
            throw new Error("Email and OTP are required");
        }

        email = email.trim().toLowerCase();
        otp = otp.trim();

        const key = `login_otp:${email}`;

        const storedOtp = await this.cache.get(key);
        if (!storedOtp) throw new Error("OTP expired or not found");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("User not found");

        await this.cache.del(key);

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

module.exports = VerifyLoginOtp;
