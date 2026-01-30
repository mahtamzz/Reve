const ResetPassword = require("../application/useCases/auth/ResetPassword");

function makeDeps(overrides = {}) {
    return {
        userRepo: { updatePassword: jest.fn() },
        cache: { get: jest.fn(), del: jest.fn() },
        tokenService: {
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefresh: jest.fn(),
        },
        hasher: { hash: jest.fn() },
        refreshTokenStore: { set: jest.fn() },
        ...overrides,
    };
}

describe("ResetPassword", () => {
    test("validates new password length", async () => {
        const deps = makeDeps();
        const uc = new ResetPassword(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123", newPassword: "123" }))
            .rejects.toThrow("Password must be at least 6 characters");

        expect(deps.cache.get).not.toHaveBeenCalled();
    });

    test("throws if OTP expired", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue(null);

        const uc = new ResetPassword(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123", newPassword: "123456" }))
            .rejects.toThrow("OTP expired");
    });

    test("throws if OTP invalid", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("999999");

        const uc = new ResetPassword(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123456", newPassword: "123456" }))
            .rejects.toThrow("Invalid OTP");
    });

    test("updates password, clears reset otp, issues tokens, stores refresh jti", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("123456");
        deps.hasher.hash.mockResolvedValue("NEWHASH");
        deps.userRepo.updatePassword.mockResolvedValue({ id: "u1", username: "alice" });

        deps.tokenService.generate.mockReturnValue("ACCESS");
        deps.tokenService.generateRefreshToken.mockReturnValue("REFRESH");
        deps.tokenService.verifyRefresh.mockReturnValue({ jti: "jti-9" });

        const uc = new ResetPassword(deps);

        const res = await uc.execute({
            email: "a@test.com",
            otp: "123456",
            newPassword: "123456",
        });

        expect(deps.userRepo.updatePassword).toHaveBeenCalledWith("a@test.com", "NEWHASH");
        expect(deps.cache.del).toHaveBeenCalledWith("reset:a@test.com");

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith(
            "u1",
            "jti-9",
            7 * 24 * 60 * 60
        );

        expect(res).toEqual({
            user: { id: "u1", username: "alice" },
            accessToken: "ACCESS",
            refreshToken: "REFRESH",
        });
    });
});
