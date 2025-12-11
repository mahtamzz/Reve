module.exports = function setTokenCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,          // REQUIRED for SameSite=None
        sameSite: "none",      // REQUIRED for cross-site cookies
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
};
