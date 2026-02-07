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

        // admin
        this.listUsersUC = deps.listUsers;
        this.deleteUserUC = deps.deleteUser;

        // identity
        this.getCurrentUserUC = deps.getCurrentUser;
        this.getCurrentCurrentAdminUC = deps.getCurrentAdmin;
        this.changePasswordUC = deps.changePassword;

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

            console.log("🔑 [DEV] User refresh token:");
            console.log(refreshToken);

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
            const authHeader = req.headers.authorization || "";
            const bearer =
                authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

            const cookieToken = req.cookies?.refreshToken; // still works for frontend
            const token = bearer || cookieToken;

            if (!token) {
                return res.status(401).json({ message: "No refresh token provided" });
            }

            const { user, accessToken, refreshToken } =
                await this.refreshTokenUC.execute(token);

            setTokenCookie(res, accessToken, refreshToken);

            // FOR SWAGGER TESTING -- use the current refresh token in the Authorize filed (not the the access token)
            console.log("🔁 [DEV] Refreshed access token:");
            console.log(accessToken);

            console.log("🔁 [DEV] Refreshed refresh token:");
            console.log(refreshToken);

            return res.json({ user });
        } catch (err) {
            return res.status(401).json({ message: err.message });
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

            console.log("🔑 [DEV] Admin access token:");
            console.log(accessToken);

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
          if (!req.admin?.admin_id) {
            return res.status(401).json({ message: "Unauthorized" });
          }
      
          const admin = await this.getCurrentCurrentAdminUC.execute(req.admin.admin_id);
          return res.json({ admin });
        } catch (err) {
          return res.status(404).json({ message: err.message });
        }
      };
      

    /* ---------------- UPDATE INFO ---------------- */
    changePassword = async (req, res) => {
        try {
            await this.changePasswordUC.execute({
                uid: req.user.uid,
                current_password: req.body.current_password,
                new_password: req.body.new_password
            });
            res.status(204).end();
        } catch (err) {
            const code = err.message === "CURRENT_PASSWORD_INCORRECT" ? 403 : 400;
            res.status(code).json({ message: err.message });
        }
    };

    /* ---------------- ADMIN ---------------- */
    listUsers = async (req, res) => {
        try {
            const result = await this.listUsersUC.execute(req.query);
            res.json(result);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    };

    deleteUser = async (req, res) => {
        try {
            await this.deleteUserUC.execute({
                userId: Number(req.params.id),
                adminId: req.admin.admin_id
            });
            res.status(204).end();
        } catch (err) {
            const code = err.message === "USER_NOT_FOUND" ? 404 : 400;
            res.status(code).json({ message: err.message });
        }
    };


}

module.exports = AuthController;
