const VerifyOtp = require("../application/useCases/auth/VerifyOtp");

function makeDeps(overrides = {}) {
    const deps = {
        userRepo: { create: jest.fn() },
        cache: { get: jest.fn(), del: jest.fn() },
        tokenService: {
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefresh: jest.fn(),
        },
        eventBus: { publish: jest.fn() },
        refreshTokenStore: { set: jest.fn() },
        ...overrides,
    };
    return deps;
}

describe("VerifyOtp use case", () => {
    test("throws if OTP expired", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue(null);

        const uc = new VerifyOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123" }))
            .rejects.toThrow("OTP expired");
    });

    test("throws if OTP invalid", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValueOnce("999999"); // otp stored

        const uc = new VerifyOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123" }))
            .rejects.toThrow("Invalid OTP");
    });

    test("throws if no pending registration", async () => {
        const deps = makeDeps();
        deps.cache.get
            .mockResolvedValueOnce("123456") // otp
            .mockResolvedValueOnce(null);    // pending_user

        const uc = new VerifyOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123456" }))
            .rejects.toThrow("No pending registration");
    });

    test("creates user, publishes event, clears cache, returns tokens, stores refresh jti", async () => {
        const deps = makeDeps();

        deps.cache.get
            .mockResolvedValueOnce("123456") // otp
            .mockResolvedValueOnce(JSON.stringify({ username: "alice", email: "a@test.com", password: "HASH" }));

        deps.userRepo.create.mockResolvedValue({ id: "u1", email: "a@test.com", username: "alice" });

        deps.tokenService.generate.mockReturnValue("ACCESS");
        deps.tokenService.generateRefreshToken.mockReturnValue("REFRESH");
        deps.tokenService.verifyRefresh.mockReturnValue({ jti: "jti-1" });

        const uc = new VerifyOtp(deps);
        const res = await uc.execute({ email: "a@test.com", otp: "123456" });

        expect(deps.eventBus.publish).toHaveBeenCalledWith("user.created", {
            uid: "u1",
            email: "a@test.com",
            username: "alice",
        });

        expect(deps.cache.del).toHaveBeenCalledWith("pending_user:a@test.com");
        expect(deps.cache.del).toHaveBeenCalledWith("otp:a@test.com");

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith("u1", "jti-1", 7 * 24 * 60 * 60);

        expect(res).toEqual({
            user: { id: "u1", email: "a@test.com", username: "alice" },
            accessToken: "ACCESS",
            refreshToken: "REFRESH",
        });
    });

    test("throws if eventBus.publish missing", async () => {
        const deps = makeDeps({ eventBus: {} });

        deps.cache.get
            .mockResolvedValueOnce("123456")
            .mockResolvedValueOnce(JSON.stringify({ username: "alice", email: "a@test.com", password: "HASH" }));
        deps.userRepo.create.mockResolvedValue({ id: "u1", email: "a@test.com", username: "alice" });

        const uc = new VerifyOtp(deps);

        await expect(uc.execute({ email: "a@test.com", otp: "123456" }))
            .rejects.toThrow("EventBus.publish not available");
    });
});
