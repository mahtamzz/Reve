class Register {
    constructor({ userRepo, cache, emailService, hasher }) {
        this.userRepo = userRepo;
        this.cache = cache;
        this.emailService = emailService;
        this.hasher = hasher;
    }

    async execute({ username, email, password }) {
        const existing = await this.userRepo.findByEmail(email);
        if (existing) throw new Error("User already exists");

        const hashedPassword = await this.hasher.hash(password);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(
            `pending_user:${email}`,
            JSON.stringify({ username, email, password: hashedPassword }),
            600
        );

        await this.cache.set(`otp:${email}`, otp, 600);

        await this.emailService.send(email, "Your OTP", otp);

        return { message: "OTP sent to email" };
    }
}

module.exports = Register;
