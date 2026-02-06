class AdminForgotPassword {
    constructor({ adminRepo, cache, emailService }) {
        this.adminRepo = adminRepo;
        this.cache = cache;
        this.emailService = emailService;
    }

    async execute({ email }) {
        if (!email || typeof email !== "string") throw new Error("Email is required");

        const emailKey = email.trim().toLowerCase();
        const key = `reset_admin:${emailKey}`;

        const admin = await this.adminRepo.findByEmail(emailKey);
        if (!admin) throw new Error("Admin not found");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(key, otp, 600);
        await this.emailService.send(emailKey, "Admin Password Reset OTP", otp);

        return { message: "Password reset OTP sent to admin" };
    }

}

module.exports = AdminForgotPassword;
