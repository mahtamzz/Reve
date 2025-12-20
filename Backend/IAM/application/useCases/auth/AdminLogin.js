class AdminLogin {
    constructor({ adminRepo, hasher, tokenService }) {
        this.adminRepo = adminRepo;
        this.hasher = hasher;
        this.tokenService = tokenService;
    }

    async execute({ email, password }) {
        const admin = await this.adminRepo.findByEmail(email);
        if (!admin) throw new Error("Invalid credentials");

        const valid = await this.hasher.compare(password, admin.password);
        if (!valid) throw new Error("Invalid credentials");

        const payload = {
            admin_id: admin.id,
            username: admin.username,
            role: "admin"
        };

        const accessToken = this.tokenService.generate(payload);
        const refreshToken = this.tokenService.generateRefreshToken(payload);

        return { admin, accessToken, refreshToken };
    }
}

module.exports = AdminLogin;
