const bcrypt = require("bcrypt");
const redis = require("../../../infrastructure/db/redis");
const userRepo = require("../../../infrastructure/repositories/UserRepository");
const EmailService = require("../../../infrastructure/mail/EmailService");

class Register {
    async execute({ username, email, password }) {
        const existing = await userRepo.findByEmail(email);
        if (existing) throw new Error("User already exists");

        const hashed = await bcrypt.hash(password, 10);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redis.set(`pending_user:${email}`,
            JSON.stringify({ username, email, password: hashed }),
            { EX: 600 }
        );

        await redis.set(`otp:${email}`, otp, { EX: 600 });

        await EmailService.send(email, "Your OTP", otp);

        return { message: "OTP sent to email" };
    }
}

module.exports = new Register();
