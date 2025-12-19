class ForgotPassword {
    constructor(userRepository, redis, emailService) {
        this.userRepository = userRepository;
        this.redis = redis;
        this.emailService = emailService;
    }

    async execute({ email }) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error("User not found or not verified");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.redis.set(`reset:${email}`, otp, { EX: 600 });
        await this.emailService.send(
            email,
            "Password Reset OTP",
            otp
        );

        return { message: "Password reset OTP sent" };
    }
}

module.exports = ForgotPassword;
