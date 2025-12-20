class SendLoginOtp {
    constructor({ userRepo, cache, emailService }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.emailService = emailService;
    }

    async execute({ email }) {
        if (!email) throw new Error("Email is required");

        email = email.trim().toLowerCase();
        const key = `login_otp:${email}`;

        const user = await this.userRepo.findByEmail(email);
        if (!user) throw new Error("User not found");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(key, otp, 120);
        await this.emailService.send(email, "Your OTP", otp);

        return { message: "OTP sent successfully" };
    }
}

module.exports = SendLoginOtp;
