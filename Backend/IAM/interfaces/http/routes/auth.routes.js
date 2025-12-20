const express = require("express");
const passport = require("passport");
const AuthController = require("../controllers/AuthController");
const auditMiddleware = require("../middleware/audit");
const createAuthMiddleware = require("../middleware/authMiddleware");
const createAdminAuthMiddleware = require("../middleware/adminAuthMiddleware");

module.exports = function createAuthRoutes(container) {
    const router = express.Router();

    const authController = new AuthController(container);

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

    
    const authMiddleware = createAuthMiddleware(container.jwtService);
    const adminAuthMiddleware = createAdminAuthMiddleware(container.jwtService);

    router.get("/me", authMiddleware, authController.me);
    router.get("/admin/me", adminAuthMiddleware, authController.adminMe);

    return router;
};
