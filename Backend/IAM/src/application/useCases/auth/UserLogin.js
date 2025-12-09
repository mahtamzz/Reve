const bcrypt = require("bcrypt");
const redis = require("../../../infrastructure/db/redis");
const userRepo = require("../../../infrastructure/repositories/UserRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");

class Login {
    async execute({ email, password }) {
        const pending = await redis.get(`pending_user:${email}`);
        if (pending) {
            throw new Error("Email not verified. Please check your inbox.");
        }

        const user = await userRepo.findByEmail(email);
        if (!user) throw new Error("Invalid credentials");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Invalid credentials");

        const token = JwtService.generate({
            user_id: user.id,
            username: user.username,
        });

        return { user, token };
    }
}

module.exports = new Login();
