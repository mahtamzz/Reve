const express = require("express");
const passport = require("passport");
const AuthController = require("../controllers/AuthController");
const auditMiddleware = require("../middleware/audit");
const createAuthMiddleware = require("../middleware/authMiddleware");
const createAdminAuthMiddleware = require("../middleware/adminAuthMiddleware");

module.exports = function createAuthRoutes(container) {
    const router = express.Router();

    const authController = new AuthController(container);

    const authMiddleware = createAuthMiddleware(container.jwtService);
    const adminAuthMiddleware = createAdminAuthMiddleware(container.jwtService);

    router.post(
        "/register",
        auditMiddleware(container.auditRepo, "REGISTER_ATTEMPT"),
        authController.register
    );

    router.post(
        "/verify-otp",
        auditMiddleware(container.auditRepo, "VERIFY_OTP"),
        authController.verifyOtp
    );

    router.post(
        "/resend-otp",
        auditMiddleware(container.auditRepo, "RESEND_OTP"),
        authController.resendOtp
    );

    router.post(
        "/login",
        auditMiddleware(container.auditRepo, "LOGIN_ATTEMPT"),
        authController.userLogin
    );

    router.post(
        "/login/send-otp",
        auditMiddleware(container.auditRepo, "SEND_LOGIN_OTP"),
        authController.sendLoginOtp
    );

    router.post(
        "/login/verify-otp",
        auditMiddleware(container.auditRepo, "VERIFY_LOGIN_OTP"),
        authController.verifyLoginOtp
    );

    router.post("/forgot-password", authController.forgotPassword);
    router.post("/reset-password", authController.resetPassword);

    /* ADMIN */
    router.post(
        "/admin/login",
        auditMiddleware(container.auditRepo, "ADMIN_LOGIN_ATTEMPT"),
        authController.adminLogin
    );

    router.post("/admin/forgot-password", authController.adminForgotPassword);
    router.post("/admin/reset-password", authController.adminResetPassword);

    router.get("/admin/users", adminAuthMiddleware, authController.listUsers);
    router.delete("/admin/users/:id", adminAuthMiddleware, authController.deleteUser);


    router.post("/refresh-token", authController.refreshToken);

    /* GOOGLE AUTH */
    router.get(
        "/google",
        passport.authenticate("google", {
            scope: ["profile", "email"],
            session: false
        })
    );

    router.get(
        "/google/callback",
        passport.authenticate("google", {
            failureRedirect: "/login",
            session: false
        }),
        authController.googleCallback
    );

    router.get("/me", authMiddleware, authController.me);
    router.get("/admin/me", adminAuthMiddleware, authController.adminMe);

    router.patch("/me/password", authMiddleware, authController.changePassword);

    /**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication & identity
 *   - name: AdminAuth
 *     description: Admin authentication
 *   - name: OAuth
 *     description: Third-party authentication
 */

    /**
     * @swagger
     * components:
     *   schemas:
     *     RegisterRequest:
     *       type: object
     *       required: [email, password]
     *       properties:
     *         email:
     *           type: string
     *           format: email
     *         password:
     *           type: string
     *           minLength: 6
     *
     *     LoginRequest:
     *       type: object
     *       required: [email, password]
     *       properties:
     *         email:
     *           type: string
     *         password:
     *           type: string
     *
     *     OtpRequest:
     *       type: object
     *       required: [email, otp]
     *       properties:
     *         email:
     *           type: string
     *         otp:
     *           type: string
     *
     *     ForgotPasswordRequest:
     *       type: object
     *       required: [email]
     *       properties:
     *         email:
     *           type: string
     *
     *     ResetPasswordRequest:
     *       type: object
     *       required: [token, newPassword]
     *       properties:
     *         token:
     *           type: string
     *         newPassword:
     *           type: string
     *
     *     UserResponse:
     *       type: object
     *       properties:
     *         id:
     *           type: integer
     *         email:
     *           type: string
     */

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
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: Registration successful, OTP sent
     *       400:
     *         description: Validation or registration error
     */

    /**
     * @swagger
     * /api/auth/verify-otp:
     *   post:
     *     summary: Verify email OTP after registration
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/OtpRequest'
     *     responses:
     *       200:
     *         description: Email verified, tokens issued
     *       400:
     *         description: Invalid OTP
     */

    /**
     * @swagger
     * /api/auth/resend-otp:
     *   post:
     *     summary: Resend email verification OTP
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: OTP resent
     */

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Login with email and password
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login successful, tokens issued
     *       401:
     *         description: Invalid credentials
     */

    /**
     * @swagger
     * /api/auth/login/send-otp:
     *   post:
     *     summary: Send OTP for passwordless login
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login OTP sent
     */

    /**
     * @swagger
     * /api/auth/login/verify-otp:
     *   post:
     *     summary: Verify login OTP
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/OtpRequest'
     *     responses:
     *       200:
     *         description: Login successful, tokens issued
     */

    /**
     * @swagger
     * /api/auth/forgot-password:
     *   post:
     *     summary: Request password reset
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ForgotPasswordRequest'
     *     responses:
     *       200:
     *         description: Password reset email sent
     */

    /**
     * @swagger
     * components:
     *   schemas:
     *     ResetPasswordOtpRequest:
     *       type: object
     *       required: [email, otp, newPassword]
     *       properties:
     *         email:
     *           type: string
     *           format: email
     *           example: user@example.com
     *         otp:
     *           type: string
     *           description: OTP sent to the user's email for password reset
     *           example: "123456"
     *         newPassword:
     *           type: string
     *           minLength: 6
     *           example: "NewStrongPass123!"
     *
     *     ResetPasswordResponse:
     *       type: object
     *       properties:
     *         user:
     *           $ref: '#/components/schemas/UserResponse'
     *         accessToken:
     *           type: string
     *         refreshToken:
     *           type: string
     *
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         message:
     *           type: string
     *           example: "Invalid OTP"
     */

    /**
     * @swagger
     * /api/auth/reset-password:
     *   post:
     *     summary: Reset user password using OTP
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ResetPasswordOtpRequest'
     *     responses:
     *       200:
     *         description: Password reset successful, tokens issued
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ResetPasswordResponse'
     *       400:
     *         description: Invalid OTP / OTP expired / weak password
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */

    /**
     * @swagger
     * /api/auth/refresh-token:
     *   post:
     *     summary: Refresh access token
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: New tokens issued
     *       401:
     *         description: Invalid refresh token
     */


    /**
     * @swagger
     * /api/auth/me:
     *   get:
     *     summary: Get current authenticated user
     *     tags: [Auth]
     *     security:
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: Current user profile
     *       401:
     *         description: Unauthorized
     */

    /**
     * @swagger
     * /api/auth/admin/login:
     *   post:
     *     summary: Admin login
     *     tags: [AdminAuth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Admin logged in
     */

    /**
     * @swagger
     * /api/auth/admin/me:
     *   get:
     *     summary: Get current authenticated admin
     *     tags: [AdminAuth]
     *     security:
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: Current admin info
     *       401:
     *         description: Unauthorized
     */

    /**
     * @swagger
     * /api/auth/google:
     *   get:
     *     summary: Start Google OAuth login
     *     tags: [OAuth]
     *     responses:
     *       302:
     *         description: Redirect to Google
     */

    /**
     * @swagger
     * /api/auth/google/callback:
     *   get:
     *     summary: Google OAuth callback
     *     tags: [OAuth]
     *     responses:
     *       302:
     *         description: Redirect to frontend after login
     */
    /**
     * @swagger
     * components:
     *   schemas:
     *     AdminForgotPasswordRequest:
     *       type: object
     *       required: [email]
     *       properties:
     *         email:
     *           type: string
     *           format: email
     *           example: admin@example.com
     *
     *     AdminResetPasswordRequest:
     *       type: object
     *       required: [email, otp, newPassword]
     *       properties:
     *         email:
     *           type: string
     *           format: email
     *           example: admin@example.com
     *         otp:
     *           type: string
     *           description: OTP sent to admin email for password reset
     *           example: "123456"
     *         newPassword:
     *           type: string
     *           minLength: 6
     *           example: "NewStrongPass123!"
     *
     *     RefreshTokenRequest:
     *       type: object
     *       required: [refreshToken]
     *       properties:
     *         refreshToken:
     *           type: string
     *           description: Refresh token previously issued during login/verify-otp.
     *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *
     *     AuthTokensResponse:
     *       type: object
     *       properties:
     *         accessToken:
     *           type: string
     *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *         refreshToken:
     *           type: string
     *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     *
     *     ErrorResponse:
     *       type: object
     *       properties:
     *         message:
     *           type: string
     *           example: "Invalid token"
     */

    /**
     * @swagger
     * /api/auth/admin/forgot-password:
     *   post:
     *     summary: Request admin password reset
     *     tags: [AdminAuth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AdminForgotPasswordRequest'
     *     responses:
     *       200:
     *         description: Admin password reset OTP sent (if account exists)
     *       400:
     *         description: Validation error
     *       429:
     *         description: Too many requests
     */

    /**
     * @swagger
     * /api/auth/admin/reset-password:
     *   post:
     *     summary: Reset admin password using OTP
     *     tags: [AdminAuth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AdminResetPasswordRequest'
     *     responses:
     *       200:
     *         description: Admin password reset successful
     *       400:
     *         description: Invalid/expired OTP or validation error
     */

    /**
     * @swagger
     * /api/auth/admin/users:
     *   get:
     *     summary: List all users (Admin only)
     *     description: >
     *       Returns a paginated list of all registered users.
     *       This endpoint is restricted to app-wide administrators.
     *     tags:
     *       - Admin
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 20
     *         description: Number of users per page
     *     responses:
     *       200:
     *         description: Paginated list of users
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *                         example: 1
     *                       email:
     *                         type: string
     *                         example: user@example.com
     *                       username:
     *                         type: string
     *                         example: john_doe
     *                       googleid:
     *                         type: string
     *                         nullable: true
     *                         example: null
     *                 meta:
     *                   type: object
     *                   properties:
     *                     page:
     *                       type: integer
     *                       example: 1
     *                     limit:
     *                       type: integer
     *                       example: 20
     *                     total:
     *                       type: integer
     *                       example: 134
     *                     totalPages:
     *                       type: integer
     *                       example: 7
     *       401:
     *         description: Unauthorized (missing or invalid admin token)
     *       403:
     *         description: Forbidden (not an admin)
     */

    /**
     * @swagger
     * /api/auth/admin/users/{id}:
     *   delete:
     *     summary: Delete a user (Admin only)
     *     description: >
     *       Permanently deletes a user from the system.
     *       This action is irreversible and will remove the user from IAM.
     *       Downstream services are expected to react via USER_DELETED events.
     *     tags:
     *       - Admin
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *           minimum: 1
     *         description: ID of the user to delete
     *     responses:
     *       204:
     *         description: User deleted successfully (no content)
     *       401:
     *         description: Unauthorized (missing or invalid admin token)
     *       403:
     *         description: Forbidden (not an admin)
     *       404:
     *         description: User not found
     */


    return router;
};
