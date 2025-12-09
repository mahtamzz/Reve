const bcrypt = require("bcrypt");
const redis = require("../../../infrastructure/db/redis");
const userRepo = require("../../../infrastructure/repositories/UserRepository");
const JwtService = require("../../../infrastructure/auth/JwtService");
const cache = require("../../../infrastructure/cache/CacheService");

class UserLogin {
async execute({ email, password }) {
        const fails = await cache.get(`login_fails:${email}`) || 0;
        if (fails >= 5) {
            throw new Error("Too many attempts (fail). Try again later.");
        }

        const user = await userRepo.findByEmail(email);

        if (!user) throw new Error("Invalid credentials");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            await cache.set(`login_fails:${email}`, fails + 1, 300);
            throw new Error("Invalid credentials");
        }

        // Reset fails
        await cache.del(`login_fails:${email}`);

        const token = JwtService.generate({
            user_id: user.id,
            username: user.username,
        });

        return { user, token };
    }
}

module.exports = new UserLogin();
