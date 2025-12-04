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
        const checkUser = await pool.query( 
            'SELECT * FROM Users WHERE email = $1',
            [email]
        );

        if (checkUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPass = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Save OTP in Redis (expires in 10 min)
        await redisClient.set(`otp:${email}`, otp, { EX: 600 });

        const insertUser = await pool.query(
            `INSERT INTO Users (username, email, password)
            VALUES ($1, $2, $3) RETURNING id, email`,
            [username, email, hashedPass]
        );

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(201).json({
            message: "User registered. OTP sent to email.",
            user_id: insertUser.rows[0].id
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const storedOtp = await redisClient.get(`otp:${email}`);

        if (!storedOtp)
            return res.status(400).json({ error: "OTP expired or not found" });

        if (storedOtp !== otp)
            return res.status(400).json({ error: "Invalid OTP" });

        await pool.query(
            `UPDATE Users SET is_verified = true WHERE email = $1`,
            [email]
        );

        await redisClient.del(`otp:${email}`);

        const token = generateToken({ user_id: user.rows[0].id, username: user.rows[0].username });

        res.json({ message: `Email verified successfully. \nToken: ${token}` });

    } catch (err) {
        console.error("OTP verify error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/resend-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query(
            `SELECT id, is_verified FROM Users WHERE email = $1`,
            [email]
        );

        if (user.rows.length === 0)
            return res.status(400).json({ error: "User not found" });

        if (user.rows[0].is_verified)
            return res.status(400).json({ error: "User already verified" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await redisClient.set(`otp:${email}`, otp, { EX: 600 });

        await sendOTPEmail(email, otp);

        res.json({ message: "New OTP sent to email" });

    } catch (err) {
        console.error("Resend OTP Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const checkUser = await pool.query( 
            'SELECT * FROM Users WHERE email = $1',
            [email]
        );

        if (checkUser.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        //compare encrypted password
        const user = checkUser.rows[0];
        
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword)
            return res.status(401).json({ error: 'Invalid credentials' });
        
        if (!user.is_verified)
            return res.status(403).json({ error: "Email not verified" });

        // create JSON web token and send it in response
        const token = generateToken({ user_id: user.id, username: user.username });
        res.json(token);

    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.user_id;  

        const user = await pool.query(
            'SELECT id, username, email FROM Users WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

const generateToken = (data) => {
    return jwt.sign(
        data,
        process.env.JWT_KEY,                        // secret key
        { expiresIn: '1h' }                            // optional expiry
    );
}

module.exports = router;