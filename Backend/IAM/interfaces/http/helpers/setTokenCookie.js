const isProduction = process.env.NODE_ENV === "production";

module.exports = function setTokens(res, accessToken, refreshToken) {
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/", 
    };

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 15,          // 15 min
    });

    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
};