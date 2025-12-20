class ForgotPassword {
    constructor({ userRepo, cache, emailService }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.emailService = emailService;
    }

    async execute({ email }) {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new Error("User not found or not verified");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(`reset:${email}`, otp, 600);
        await this.emailService.send(
            email,
            "Password Reset OTP",
            otp
        );

        return { message: "Password reset OTP sent" };
    }
}

module.exports = ForgotPassword;
