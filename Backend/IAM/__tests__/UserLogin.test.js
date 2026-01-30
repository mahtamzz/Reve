const UserLogin = require("../application/useCases/auth/UserLogin");

function makeDeps(overrides = {}) {
    const deps = {
        userRepo: { findByEmail: jest.fn() },
        cache: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        tokenService: {
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefresh: jest.fn(),
        },
        hasher: { compare: jest.fn() },
        refreshTokenStore: { set: jest.fn() },
        ...overrides,
    };
    return deps;
}

describe("UserLogin use case", () => {
    test("blocks login after 5 failures", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("5");

        const uc = new UserLogin(deps);

        await expect(uc.execute({ email: "a@test.com", password: "x" }))
            .rejects.toThrow("Too many attempts. Try again later.");

        expect(deps.userRepo.findByEmail).not.toHaveBeenCalled();
    });

    test("throws invalid credentials if user not found", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("0");
        deps.userRepo.findByEmail.mockResolvedValue(null);

        const uc = new UserLogin(deps);

        await expect(uc.execute({ email: "a@test.com", password: "x" }))
            .rejects.toThrow("Invalid credentials");
    });

    test("increments fail counter on wrong password", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("2");
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1", username: "alice", password: "hash" });
        deps.hasher.compare.mockResolvedValue(false);

        const uc = new UserLogin(deps);

        await expect(uc.execute({ email: "a@test.com", password: "wrong" }))
            .rejects.toThrow("Invalid credentials");

        expect(deps.cache.set).toHaveBeenCalledWith("login_fails:a@test.com", 3, 300);
        expect(deps.cache.del).not.toHaveBeenCalled();
    });

    test("successful login clears fails, issues tokens, stores refresh jti", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue("1");
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1", username: "alice", password: "hash" });
        deps.hasher.compare.mockResolvedValue(true);

        deps.tokenService.generate.mockReturnValue("ACCESS");
        deps.tokenService.generateRefreshToken.mockReturnValue("REFRESH");
        deps.tokenService.verifyRefresh.mockReturnValue({ jti: "jti-123" });

        const uc = new UserLogin(deps);

        const result = await uc.execute({ email: "a@test.com", password: "ok" });

        expect(deps.cache.del).toHaveBeenCalledWith("login_fails:a@test.com");

        expect(deps.tokenService.generate).toHaveBeenCalledWith(
            { uid: "u1", username: "alice" },
            "15m"
        );

        expect(deps.tokenService.generateRefreshToken).toHaveBeenCalledWith(
            { uid: "u1", username: "alice" },
            "7d"
        );

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith(
            "u1",
            "jti-123",
            7 * 24 * 60 * 60
        );

        expect(result).toEqual({
            user: { id: "u1", username: "alice", password: "hash" },
            accessToken: "ACCESS",
            refreshToken: "REFRESH",
        });
    });
});
