const express = require("express");
const router = express.Router();
const passport = require("passport");
const AuthController = require("../controllers/AuthController");
const container = require("../../../container");
const { loginLimiter } = require("../middleware/rateLimiter");
const auditMiddleware = require('../middleware/audit');
const authMiddleware = require("../middleware/authMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const authController = new AuthController(container);

router.post("/register", auditMiddleware('REGISTER_ATTEMPT'), authController.register);
router.post("/verify-otp", auditMiddleware('VERIFY_OTP'), authController.verifyOtp);
router.post("/resend-otp", auditMiddleware('RESEND_OTP'), authController.resendOtp);
router.post("/login", auditMiddleware('LOGIN_ATTEMPT'), authController.userLogin);
router.post("/login/send-otp", auditMiddleware("SEND_LOGIN_OTP"), authController.sendLoginOtp);
router.post("/login/verify-otp", auditMiddleware("VERIFY_LOGIN_OTP"), authController.verifyLoginOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
// Admin Routes
router.post("/admin/login", auditMiddleware('ADMIN_LOGIN_ATTEMPT'), authController.adminLogin);
router.post("/admin/forgot-password", authController.adminForgotPassword);
router.post("/admin/reset-password", authController.adminResetPassword);

router.post("/refresh-token", authController.refreshToken);

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

router.get("/me", authMiddleware, authController.me);
router.get("/admin/me", adminAuthMiddleware, authController.adminMe);



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
 *         description: Password reset successfully, token is set in HTTP-only cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid OTP or password
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

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT using refresh token cookie
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New access (and refresh) tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /api/auth/me:
 * get:
 *   summary: Get User's authenticated identity
 *   tags: [Auth]
 *   security:
 *     - cookieAuth: []
 *   responses:
 *     200:
 *       description: Authenticated identity
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 */

/**
 * @swagger
 * /api/auth/admin/me:
 * get:
 *   summary: Get Admin's authenticated identity
 *   tags: [Auth]
 *   security:
 *     - cookieAuth: []
 *   responses:
 *     200:
 *       description: Authenticated identity
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 */

module.exports = router;