const Register = require("../../../application/useCases/auth/Register");
const VerifyOtp = require("../../../application/useCases/auth/VerifyOtp");
const ResendOtp = require("../../../application/useCases/auth/ResendOtp");
const UserLogin = require("../../../application/useCases/auth/UserLogin");
const ForgotPassword = require("../../../application/useCases/auth/ForgotPassword");
const ResetPassword = require("../../../application/useCases/auth/ResetPassword");
const GoogleAuth = require("../../../application/useCases/auth/GoogleAuth");
const AuthValidator = require("../validators/AuthValidator");
const AdminLogin = require("../../../application/useCases/auth/AdminLogin");
const AdminForgotPassword = require("../../../application/useCases/auth/AdminForgotPassword");
const AdminResetPassword = require("../../../application/useCases/auth/AdminResetPassword");

class AuthController {

    async register(req, res) {
        const { error } = AuthValidator.register(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await Register.execute(req.body);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { user, token } = await VerifyOtp.execute(req.body);
            res.json({ message: "Email verified", user, token });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async resendOtp(req, res) {
        try {
            const result = await ResendOtp.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async userLogin(req, res) {
        const { error } = AuthValidator.login(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const { user, token } = await UserLogin.execute(req.body);
            const { password, ...safeUser } = user;

            return res.json({
                user: safeUser,
                token,
            });
        } catch (err) {
            return res.status(401).json({ message: err.message });
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
            const { user, token } = await ResetPassword.execute(req.body);
            res.json({ user, token, message: "Password reset successfully" });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async googleCallback(req, res) {
        try {
            const { user, token } = await GoogleAuth.execute(req.user);
            res.redirect(`http://localhost:5173/dashboard`);
        } catch (err) {
            res.status(500).json({ message: "Google auth failed" });
        }
    }

    async adminLogin(req, res) {
        try {
            const { admin, token } = await AdminLogin.execute(req.body);
            res.json({ admin, token });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }

    async adminForgotPassword(req, res) {
        const { error } = AuthValidator.forgotPassword(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const result = await AdminForgotPassword.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async adminResetPassword(req, res) {
        const { error } = AuthValidator.resetPassword(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const { admin, token } = await AdminResetPassword.execute(req.body);
            res.json({ admin, token, message: "Admin password reset successfully" });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

}

module.exports = new AuthController();
