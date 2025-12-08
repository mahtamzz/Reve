const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');       
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const pool = require('../DB/postgres');
const authMiddleware = require('../middleware/auth');
// const { loginRateLimiter, otpRateLimiter } = require('../middleware/rateLimiter');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const sendOTPEmail = require('../utils/sendEmail');
const redisClient = require("../DB/redis");

const createUserSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});


router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    console.log('Registration attempt:', { username, email, password }); /////////

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

router.post('/login', loginRateLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {

        // If not in PostgreSQL, check Redis for pending verification. User should be redirected to verifying page.
        const tempUserStr = await redisClient.get(`pending:${email}`);
        if (tempUserStr) {
            return res.status(403).json({ error: "Email not verified yet. Please check your inbox for OTP." });
        }

        const dbUserResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);

        if (dbUserResult.rows.length > 0) {
            const user = dbUserResult.rows[0];
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword)
                return res.status(401).json({ error: 'Invalid credentials.' });

            const token = generateToken({ user_id: user.id, username: user.username });
            return res.json({ message: "Login successful", token });
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


/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user (sends OTP to email)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: myStrongPassword123
 *     responses:
 *       201:
 *         description: OTP sent to email
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: Verify OTP and create user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified, account created
 *       400:
 *         description: OTP expired or invalid
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/users/resend-otp:
 *   post:
 *     summary: Resend OTP code to the user’s email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP resent
 *       400:
 *         description: No registration pending
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: myStrongPassword123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Request a password reset OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *       400:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: newStrongPass123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or password too short
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       401:
 *         description: Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authorization token required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
