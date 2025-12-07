const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../DB/postgres');

router.get("/google",
    (req, res, next) => {
        req.session.origin = req.query.origin || "login";  // save it
        next();
    },
    passport.authenticate("google", {
        scope: ["email", "profile"],
    })
);

router.get('/google/callback', 
    (req, res, next) => {
        const origin = req.session.origin || "login";

        passport.authenticate("google", {
            session: false,
            failureRedirect:
            origin === "register"
                ? "http://localhost:5137/register"
                : "http://localhost:5137/login"
        })(req, res, next);
    },
    async (req, res) => {
        try {
            //Check user's availablity using googleID or email
            const profile = req.user;
            const checkUser = await pool.query(
            'SELECT * FROM users WHERE googleid = $1 OR email = $2',
            [profile.id, profile.emails[0].value]  
            );

            let user;

            if (checkUser.rows.length > 0) {
                // User is available -Update googleID, generate token and send it
                user = checkUser.rows[0];
                if (!user.googleid) {
                    await pool.query(
                        `UPDATE users SET googleid = $1 WHERE user_id = $2`,
                        [profile.id, user.id]
                    );
                    user.google_id = profile.id;
                }
            } else {
            
                const usernameSource =
                    profile.displayName ||
                    profile.name?.givenName ||
                    (profile.emails && profile.emails[0]?.value.split("@")[0]) ||
                    "user";

                const baseUsername =
                    usernameSource.replace(/\s+/g, "").toLowerCase() +
                    Math.floor(Math.random() * 10000);

            
                const insertUser = await pool.query(
                    `INSERT INTO users (googleid, email, username) VALUES ($1, $2, $3) RETURNING *`,
                    [profile.id, profile.emails[0].value, baseUsername]
                );
            
                user = insertUser.rows[0];
            }
            
            const token = jwt.sign({ user_id: user.id, username: user.username }, process.env.JWT_KEY, { expiresIn: '1h' });
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    googleid: user.googleid
                }
            });

            res.redirect(`http://localhost:5137/dashboard?token=${token}`);
        } catch (err) {
            console.error("OAuth error:", err);
            res.status(500).json({ error: "OAuth login failed" });
        }
    });

module.exports = router;



/**
 * @swagger
 * /api/auth/google?origin=register:
 *   get:
 *     summary: Login/register using Google OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google consent screen
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns JWT token
 *       500:
 *         description: OAuth error
 */
