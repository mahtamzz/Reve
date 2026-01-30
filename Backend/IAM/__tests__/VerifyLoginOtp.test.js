const VerifyLoginOtp = require("../application/useCases/auth/VerifyLoginOtp");

function makeDeps(overrides = {}) {
    return {
        userRepo: { findByEmail: jest.fn() },
        cache: { get: jest.fn(), del: jest.fn() },
        tokenService: {
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefresh: jest.fn(),
        },
        refreshTokenStore: { set: jest.fn() },
        ...overrides,
    };
}

describe("VerifyLoginOtp", () => {
    test("requires email and otp", async () => {
        const deps = makeDeps();
        const uc = new VerifyLoginOtp(deps);

        await expect(uc.execute({ email: "", otp: "" }))
            .rejects.toThrow("Email and OTP are required");
    });

    test("throws if stored otp missing", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue(null);

        const uc = new VerifyLoginOtp(deps);

        await expect(uc.execute({ email: " A@TEST.COM ", otp: "123456" }))
            .rejects.toThrow("OTP expired or not found");

        expect(deps.cache.get).toHaveBeenCalledWith("login_otp:a@test.com");
    });

    test("throws if otp invalid", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("999999");

        const uc = new VerifyLoginOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123456" }))
            .rejects.toThrow("Invalid OTP");
    });

    test("throws if user not found", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("123456");
        deps.userRepo.findByEmail.mockResolvedValue(null);

        const uc = new VerifyLoginOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123456" }))
            .rejects.toThrow("User not found");
    });

    test("successful login clears otp, issues tokens, stores refresh jti", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("123456");
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1", username: "alice" });

        deps.tokenService.generate.mockReturnValue("ACCESS");
        deps.tokenService.generateRefreshToken.mockReturnValue("REFRESH");
        deps.tokenService.verifyRefresh.mockReturnValue({ jti: "jti-77" });

        const uc = new VerifyLoginOtp(deps);

        const res = await uc.execute({ email: " A@TEST.COM ", otp: " 123456 " });

        expect(deps.cache.del).toHaveBeenCalledWith("login_otp:a@test.com");

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith(
            "u1",
            "jti-77",
            7 * 24 * 60 * 60
        );

        expect(res).toEqual({
            user: { id: "u1", username: "alice" },
            accessToken: "ACCESS",
            refreshToken: "REFRESH",
        });
    });
});
