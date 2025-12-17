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
const SendLoginOtp = require("../../../application/useCases/auth/SendLoginOtp");
const VerifyLoginOtp = require("../../../application/useCases/auth/VerifyLoginOtp");
const setTokenCookie = require("../helpers/setTokenCookie")
const RefreshTokenUseCase = require("../../../application/useCases/auth/RefreshToken");

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
            const { user, accessToken, refreshToken } = await VerifyOtp.execute(req.body);
            const { password, ...safeUser } = user;

            setTokenCookie(res, accessToken, refreshToken);

            res.json({
                message: "Email verified",
                user: safeUser
            });
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
            const { user, accessToken, refreshToken } = await UserLogin.execute(req.body);
            const { password, ...safeUser } = user;

            setTokenCookie(res, accessToken, refreshToken);

            return res.json({
                user: safeUser
            });
        } catch (err) {
            return res.status(401).json({ message: err.message });
        }
    }


    async sendLoginOtp(req, res) {
        try {
            const result = await SendLoginOtp.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async verifyLoginOtp(req, res) {
        try {
            const { user, accessToken, refreshToken } = await VerifyLoginOtp.execute(req.body);
            const { password, ...safeUser } = user;

            setTokenCookie(res, accessToken, refreshToken);

            res.json({ user: safeUser });
        } catch (err) {
            res.status(400).json({ message: err.message });
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
            const { user, accessToken, refreshToken } = await ResetPassword.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);

            res.json({ 
                user, 
                message: "Password reset successfully" 
            });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async googleCallback(req, res) {
        try {
            const { user, accessToken, refreshToken } = await GoogleAuth.execute(req.user);

            setTokenCookie(res, accessToken, refreshToken);

            res.redirect("http://localhost:5173/dashboard");
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Google auth failed" });
        }
    }

    async adminLogin(req, res) {
        try {
            const { admin, accessToken, refreshToken } = await AdminLogin.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);

            return res.json({ admin }); // token is now in cookie
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
            const { admin, accessToken, refreshToken } = await AdminResetPassword.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);

            res.json({ admin, message: "Admin password reset successfully" });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            const { user, accessToken, refreshToken: newRefreshToken } = await RefreshTokenUseCase.execute(refreshToken);

            setTokenCookie(res, accessToken, newRefreshToken);

            res.json({ message: "Token refreshed", user });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    }

        async me(req, res) {
        res.json({
            uid: req.user.uid,
            email: req.user.email,
            role: req.user.role
        });
    }

    async adminMe(req, res) {
        res.json({
            id: req.admin.id,
            email: req.admin.email,
            role: "admin"
        });
    }

}

module.exports = new AuthController();
