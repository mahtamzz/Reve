class AdminForgotPassword {
    constructor({ adminRepo, cache, emailService }) {
        this.adminRepo = adminRepo;
        this.cache = cache;
        this.emailService = emailService;
    }

    async execute({ email }) {
        const admin = await this.adminRepo.findByEmail(email);
        if (!admin) throw new Error("Admin not found");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cache.set(`reset_admin:${email}`, otp, 600);
        await this.emailService.send(email, "Admin Password Reset OTP", otp);

        return { message: "Password reset OTP sent to admin" };
    }
}

module.exports = AdminForgotPassword;
