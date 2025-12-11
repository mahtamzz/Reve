module.exports = function setTokens(res, accessToken, refreshToken) {
    // Short-lived access token
    res.cookie("token", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 15 // 15 minutes
    });

    // Long-lived refresh token
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    });
};
