const express = require("express");
const router = express.Router();
const passport = require("passport");
const AuthController = require("../controllers/AuthController");
const { loginLimiter } = require("../middleware/rateLimiter");
const auditMiddleware = require('../middleware/audit');


router.post("/register", auditMiddleware('REGISTER_ATTEMPT'), (req, res) => AuthController.register(req, res));
router.post("/verify-otp", auditMiddleware('VERIFY_OTP'), (req, res) => AuthController.verifyOtp(req, res));
router.post("/resend-otp", auditMiddleware('RESEND_OTP'), (req, res) => AuthController.resendOtp(req, res));
router.post("/login", auditMiddleware('LOGIN_ATTEMPT'), (req, res) => AuthController.userLogin(req, res));
router.post("/login/send-otp", auditMiddleware("SEND_LOGIN_OTP"), (req, res) => AuthController.sendLoginOtp(req, res));
router.post("/login/verify-otp", auditMiddleware("VERIFY_LOGIN_OTP"), (req, res) => AuthController.verifyLoginOtp(req, res));
router.post("/forgot-password", (req, res) => AuthController.forgotPassword(req, res));
router.post("/reset-password", (req, res) => AuthController.resetPassword(req, res));
// Admin Routes
router.post("/admin/login", auditMiddleware('ADMIN_LOGIN_ATTEMPT'), (req, res) => AuthController.adminLogin(req, res));
router.post("/admin/forgot-password", (req, res) => AuthController.adminForgotPassword(req, res));
router.post("/admin/reset-password", (req, res) => AuthController.adminResetPassword(req, res));


/* ---------------- GOOGLE AUTH ROUTES ---------------- */
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false 
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: false }),
    (req, res) => AuthController.googleCallback(req, res)
);




/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP sent to user email (registration)
 *     tags: [Auth]
 *     description: Verifies OTP and sets an HTTP-only authentication cookie.
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, cookie set.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: auth_token=abc123; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid or expired OTP
 */

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       400:
 *         description: Failed to resend OTP
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login with email and password
 *     tags: [Auth]
 *     description: Logs in the user and sets an HTTP-only authentication cookie.
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, cookie set.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: auth_token=abc123; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/login/send-otp:
 *   post:
 *     summary: Send OTP to email for login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: 
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent
 */

/**
 * @swagger
 * /api/auth/login/verify-otp:
 *   post:
 *     summary: Verify OTP and log in user
 *     tags: [Auth]
 *     description: Verifies login OTP and sets an HTTP-only authentication cookie.
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
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, cookie set.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: auth_token=abc123; HttpOnly; Secure; SameSite=None
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid OTP
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset link to user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Invalid email
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
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
 *                 format: email
 *                 description: User's email
 *               otp:
 *                 type: string
 *                 description: OTP sent to user's email
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or password
 */

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/admin/forgot-password:
 *   post:
 *     summary: Send password reset link to admin email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Invalid email
 */

/**
 * @swagger
 * /api/auth/admin/reset-password:
 *   post:
 *     summary: Reset admin password
 *     tags: [Auth]
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
 *                 format: email
 *                 description: Admin's email
 *               otp:
 *                 type: string
 *                 description: OTP sent to admin's email
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Admin password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid OTP or password
 */

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Authenticate using Google OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google login
 */

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to dashboard after successful login
 *       500:
 *         description: Google authentication failed
 */

module.exports = router;