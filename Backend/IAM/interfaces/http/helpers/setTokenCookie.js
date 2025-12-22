const isProduction = process.env.NODE_ENV === "production";

module.exports = function setTokens(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,        // only true in prod
        sameSite: isProduction ? "none" : "lax",
        path: "/api", 
        maxAge: 1000 * 60 * 15
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api", 
        maxAge: 1000 * 60 * 60 * 24 * 7
    });
};
