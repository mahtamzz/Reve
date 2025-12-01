const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');       
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const pool = require('../DB/db');
const authMiddleware = require('../middleware/auth');

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

        const insertUser = await pool.query(
            'INSERT INTO Users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPass] // in production, hash your password!
        );

        const token = generateToken({ user_id: insertUser.rows[0].user_id, username });

        res.status(201).json(token);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    //find user from database by email
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