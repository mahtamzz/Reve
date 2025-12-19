class ResendOtp {
    constructor({ cache, emailService }) {
        this.cache = cache;
        this.emailService = emailService;
    }

    async execute({ email }) {
        const pendingUser = await this.cache.get(`pending_user:${email}`);
        if (!pendingUser) {
            throw new Error("No registration pending for this email");
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(`otp:${email}`, otp, 600);
        await this.emailService.send(email, "Your OTP", otp);

        return { message: "OTP resent to email" };
    }
}

module.exports = ResendOtp;
