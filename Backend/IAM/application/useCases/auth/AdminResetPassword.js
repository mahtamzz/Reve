class AdminResetPassword {
    constructor({ adminRepo, cache, hasher, tokenService }) {
        this.adminRepo = adminRepo;
        this.cache = cache;
        this.hasher = hasher;
        this.tokenService = tokenService;
    }

    async execute({ email, otp, newPassword }) {
        if (!email || typeof email !== "string") {
            throw new Error("Email is required");
        }
        if (!otp || typeof otp !== "string") {
            throw new Error("OTP is required");
        }
        if (!newPassword || newPassword.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        const emailKey = email.trim().toLowerCase();
        const key = `reset_admin:${emailKey}`;

        console.log("[ADMIN RESET] key:", key, "otp:", otp);

        const storedOtp = await this.cache.get(key);
        console.log("[ADMIN RESET] storedOtp:", storedOtp);

        if (!storedOtp) throw new Error("OTP expired");
        if (storedOtp !== otp) throw new Error("Invalid OTP");

        const hashedPassword = await this.hasher.hash(newPassword);
        const admin = await this.adminRepo.updatePassword(emailKey, hashedPassword);

        await this.cache.del(key);

        const payload = { admin_id: admin.id, username: admin.username, role: "admin" };
        const accessToken = this.tokenService.generate(payload);
        // const refreshToken = this.tokenService.generateRefresh(payload);
        const refreshToken = "fjd";
        return { admin, accessToken, refreshToken };
    }
}


module.exports = AdminResetPassword;
