class AdminResetPassword {
    constructor({ adminRepo, cache, hasher, tokenService }) {
        this.adminRepo = adminRepo;
        this.cache = cache;
        this.hasher = hasher;
        this.tokenService = tokenService;
    }

    async execute({ email, otp, newPassword }) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const storedOtp = await this.cache.get(`reset_admin:${email}`);
        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const hashedPassword = await this.hasher.hash(newPassword);
        const admin = await this.adminRepo.updatePassword(email, hashedPassword);

        await this.cache.del(`reset_admin:${email}`);

        const payload = {
            admin_id: admin.id,
            username: admin.username,
            role: "admin"
        };

        const accessToken = this.tokenService.generate(payload);
        const refreshToken = this.tokenService.generateRefresh(payload);

        return { admin, accessToken, refreshToken };
    }
}

module.exports = AdminResetPassword;
