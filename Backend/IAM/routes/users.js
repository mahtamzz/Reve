const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');       
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const pool = require('../DB/postgres');
const authMiddleware = require('../middleware/auth');
const sendOTPEmail = require('../utils/sendEmail');
const redisClient = require("../DB/redis");

const createUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const joiValidation = createUserSchema.validate(req.body);
    if (joiValidation.error) {
        return res.status(400).json(joiValidation.error.details[0].message);
    }

    try {
        const existingUser = await pool.query(
            'SELECT id FROM Users WHERE email = $1',
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const pendingUser = await redisClient.get(`pending_user:${email}`);
        if (pendingUser) {
            await redisClient.del(`pending_user:${email}`);
            await redisClient.del(`otp:${email}`);
        }

        const hashedPass = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store user data temporarily in Redis
        await redisClient.set(
            `pending_user:${email}`,
            JSON.stringify({ username, email, password: hashedPass }),
            { EX: 600 } // expires in 10 minutes
        );

        // Store OTP
        await redisClient.set(`otp:${email}`, otp, { EX: 600 });

        await sendOTPEmail(email, otp);

        res.status(201).json({ message: "OTP sent to email" });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const storedOtp = await redisClient.get(`otp:${email}`);
        if (!storedOtp) return res.status(400).json({ error: "OTP expired!" });
        if (storedOtp !== otp) return res.status(400).json({ error: "Invalid OTP." });

        // Get pending user from Redis
        const pendingUserData = await redisClient.get(`pending_user:${email}`);
        if (!pendingUserData) return res.status(400).json({ error: "No registration pending for this email" });

        const userData = JSON.parse(pendingUserData);

        // Insert verified user into PostgreSQL
        const insertResult = await pool.query(
            `INSERT INTO Users (username, email, password)
            VALUES ($1, $2, $3) RETURNING id, username`,
            [userData.username, userData.email, userData.password]
        );

        const user = insertResult.rows[0];

        // Delete pending data and OTP
        await redisClient.del(`pending_user:${email}`);
        await redisClient.del(`otp:${email}`);

        // Generate JWT
        const token = generateToken({ user_id: user.id, username: user.username });

        res.json({ message: "Email verified and account created!", token });

    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const pendingUser = await redisClient.get(`pending_user:${email}`);
        if (!pendingUser) {
            return res.status(400).json({ error: "No registration pending for this email" });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.set(`otp:${email}`, otp, { EX: 600 });

        await sendOTPEmail(email, otp);

        res.json({ message: "OTP resent to email" });

    } catch (err) {
        console.error("Resend OTP error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const dbUserResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (dbUserResult.rows.length > 0) {
            const user = dbUserResult.rows[0];
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword)
                return res.status(401).json({ error: 'Invalid credentials.' });

            const token = generateToken({ user_id: user.id, username: user.username });
            return res.json({ message: "Login successful", token });
        }

        // If not in PostgreSQL, check Redis for pending verification. User should be redirected to verifying page.
        const tempUserStr = await redisClient.get(`pending:${email}`);
        if (tempUserStr) {
            return res.status(403).json({ error: "Email not verified yet. Please check your inbox for OTP." });
        }

        return res.status(401).json({ error: "Invalid credentials" });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Only verified users can reset password
        const dbUserResult = await pool.query('SELECT id FROM Users WHERE email = $1', [email]);
        if (dbUserResult.rows.length === 0) {
            return res.status(400).json({ error: "User not found or not verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await redisClient.set(`reset:${email}`, otp, { EX: 600 });
        await sendOTPEmail(email, otp);

        res.json({ message: "Password reset OTP sent to email." });

    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
        return res.status(400).json({ error: "Password must be at least 6 characters" });

    try {
        const storedOtp = await redisClient.get(`reset:${email}`);
        if (!storedOtp) return res.status(400).json({ error: "OTP expired!" });
        if (storedOtp !== otp) return res.status(400).json({ error: "Invalid OTP." });

        const hashedPass = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE Users SET password = $1 WHERE email = $2', [hashedPass, email]);

        await redisClient.del(`reset:${email}`);
        res.json({ message: "Password reset successfully." });

    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const userResult = await pool.query('SELECT id, username, email FROM Users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error('Get me error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


const generateToken = (data) => {
    return jwt.sign(
        data,
        process.env.JWT_KEY,                        // secret key
        { expiresIn: '1h' }                            // optional expiry
    );
}

module.exports = router;