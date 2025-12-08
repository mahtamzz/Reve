const RegisterUser = require("../../../application/useCases/auth/Register");
const VerifyOtp = require("../../../application/useCases/auth/VerifyOtp");
const ResendOtp = require("../../../application/useCases/auth/ResendOtp");
const LoginUser = require("../../../application/useCases/auth/Login");
const ForgotPassword = require("../../../application/useCases/auth/ForgotPassword");
const ResetPassword = require("../../../application/useCases/auth/ResetPassword");
const GoogleAuth = require("../../../application/useCases/auth/GoogleAuth");
const AuthValidator = require("../validators/AuthValidator");

class AuthController {

    async register(req, res) {
        const { error } = AuthValidator.register(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await RegisterUser.execute(req.body);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async verifyOtp(req, res) {
        const { error } = AuthValidator.verifyOtp(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await VerifyOtp.execute(req.body);
            res.json({ message: "Email verified", user: result });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async resendOtp(req, res) {
        const { error } = AuthValidator.verifyOtp(req.body); // reuse OTP validation
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await ResendOtp.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async login(req, res) {
        const { error } = AuthValidator.login(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await LoginUser.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }

    async forgotPassword(req, res) {
        const { error } = AuthValidator.forgotPassword(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await ForgotPassword.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async resetPassword(req, res) {
        const { error } = AuthValidator.resetPassword(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await ResetPassword.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async googleCallback(req, res) {
        try {
            const { user, token } = await GoogleAuth.execute(req.user);
            res.redirect(`http://localhost:5137/dashboard?token=${token}`);
        } catch (err) {
            res.status(500).json({ message: "Google auth failed" });
        }
    }
}

module.exports = new AuthController();
