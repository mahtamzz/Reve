const AuthValidator = require("../validators/AuthValidator");
const setTokenCookie = require("../helpers/setTokenCookie");

class AuthController {
    constructor(deps) {
        // user auth
        this.registerUC = deps.register;
        this.verifyOtpUC = deps.verifyOtp;
        this.resendOtpUC = deps.resendOtp;
        this.userLoginUC = deps.userLogin;
        this.sendLoginOtpUC = deps.sendLoginOtp;
        this.verifyLoginOtpUC = deps.verifyLoginOtp;
        this.forgotPasswordUC = deps.forgotPassword;
        this.resetPasswordUC = deps.resetPassword;
        this.refreshTokenUC = deps.refreshToken;
        this.googleAuthUC = deps.googleAuth;

        // admin auth
        this.adminLoginUC = deps.adminLogin;
        this.adminForgotPasswordUC = deps.adminForgotPassword;
        this.adminResetPasswordUC = deps.adminResetPassword;

        // identity
        this.getCurrentUserUC = deps.getCurrentUser;
        this.getCurrentCurrentAdminUC = deps.getCurrentAdmin;

        // bind non–arrow methods
        this.refreshToken = this.refreshToken.bind(this);
        this.me = this.me.bind(this);
        this.adminMe = this.adminMe.bind(this);
    }

    /* ---------------- USER AUTH ---------------- */

    register = async (req, res) => {
        const { error } = AuthValidator.register(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const result = await this.registerUC.execute(req.body);
            res.status(201).json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    verifyOtp = async (req, res) => {
        try {
            const { user, accessToken, refreshToken } =
                await this.verifyOtpUC.execute(req.body);

            const { password, ...safeUser } = user;
            setTokenCookie(res, accessToken, refreshToken);

            res.json({ message: "Email verified", user: safeUser });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    resendOtp = async (req, res) => {
        try {
            const result = await this.resendOtpUC.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    userLogin = async (req, res) => {
        const { error } = AuthValidator.login(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const { user, accessToken, refreshToken } =
                await this.userLoginUC.execute(req.body);

            const { password, ...safeUser } = user;
            setTokenCookie(res, accessToken, refreshToken);

            // FOR SWAGGER TESTING -- DEV ONLY
            console.log("🔑 [DEV] User access token:");
            console.log(accessToken);

            res.json({ user: safeUser });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    };

    sendLoginOtp = async (req, res) => {
        try {
            const result = await this.sendLoginOtpUC.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    verifyLoginOtp = async (req, res) => {
        try {
            const { user, accessToken, refreshToken } =
                await this.verifyLoginOtpUC.execute(req.body);

            const { password, ...safeUser } = user;
            setTokenCookie(res, accessToken, refreshToken);

            res.json({ user: safeUser });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    forgotPassword = async (req, res) => {
        const { error } = AuthValidator.forgotPassword(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const result = await this.forgotPasswordUC.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    resetPassword = async (req, res) => {
        const { error } = AuthValidator.resetPassword(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        try {
            const { user, accessToken, refreshToken } =
                await this.resetPasswordUC.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);
            res.json({ user, message: "Password reset successfully" });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    refreshToken = async (req, res) => {
        try {
            const token = req.cookies.refreshToken;
            const { user, accessToken, refreshToken } =
                await this.refreshTokenUC.execute(token);

            setTokenCookie(res, accessToken, refreshToken);
            res.json({ user });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    };

    /* ---------------- GOOGLE AUTH ---------------- */

    googleCallback = async (req, res) => {
        try {
            const { accessToken, refreshToken } =
                await this.googleAuthUC.execute(req.user);

            setTokenCookie(res, accessToken, refreshToken);
            res.redirect("http://localhost:5173/dashboard");
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Google auth failed" });
        }
    };

    /* ---------------- ADMIN AUTH ---------------- */

    adminLogin = async (req, res) => {
        try {
            const { admin, accessToken, refreshToken } =
                await this.adminLoginUC.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);
            res.json({ admin });
        } catch (err) {
            res.status(401).json({ message: err.message });
        }
    };

    adminForgotPassword = async (req, res) => {
        try {
            const result = await this.adminForgotPasswordUC.execute(req.body);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    adminResetPassword = async (req, res) => {
        try {
            const { admin, accessToken, refreshToken } =
                await this.adminResetPasswordUC.execute(req.body);

            setTokenCookie(res, accessToken, refreshToken);
            res.json({ admin });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    /* ---------------- IDENTITY ---------------- */

    me = async (req, res) => {
        try {
            const user = await this.getCurrentUserUC.execute(req.user.uid);
            const { password, ...safeUser } = user;
            res.json({ user: safeUser });
        } catch (err) {
            res.status(404).json({ message: err.message });
        }
    };

    adminMe = async (req, res) => {
        try {
            const admin = await this.getCurrentCurrentAdminUC.execute(req.user.uid);
            res.json({ admin });
        } catch (err) {
            res.status(404).json({ message: err.message });
        }
    };
}

module.exports = AuthController;
