const express = require("express");
const router = express.Router();
const passport = require("passport");
const AuthController = require("../controllers/AuthController");

router.post("/register", (req, res) => AuthController.register(req, res));
router.post("/verify-otp", (req, res) => AuthController.verifyOtp(req, res));
router.post("/resend-otp", (req, res) => AuthController.resendOtp(req, res));
router.post("/login", (req, res) => AuthController.login(req, res));
router.post("/forgot-password", (req, res) => AuthController.forgotPassword(req, res));
router.post("/reset-password", (req, res) => AuthController.resetPassword(req, res));


/* ---------------- GOOGLE AUTH ROUTES ---------------- */
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => AuthController.googleCallback(req, res)
);

module.exports = router;
