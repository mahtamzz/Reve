const RefreshToken = require("../application/useCases/auth/RefreshToken");

function makeDeps(overrides = {}) {
    return {
        jwtService: {
            verifyRefresh: jest.fn(),
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
        },
        userRepository: { findById: jest.fn() },
        refreshTokenStore: {
            matches: jest.fn(),
            set: jest.fn(),
        },
        ...overrides,
    };
}

describe("RefreshToken", () => {
    test("throws if no refresh token provided", async () => {
        const deps = makeDeps();
        const uc = new RefreshToken(deps.jwtService, deps.userRepository, deps.refreshTokenStore);

        await expect(uc.execute("")).rejects.toThrow("No refresh token provided");
    });

    test("throws if verifyRefresh fails", async () => {
        const deps = makeDeps();
        deps.jwtService.verifyRefresh.mockImplementation(() => { throw new Error("bad"); });

        const uc = new RefreshToken(deps.jwtService, deps.userRepository, deps.refreshTokenStore);

        await expect(uc.execute("RT")).rejects.toThrow("Invalid or expired refresh token");
    });

    test("throws if refresh token revoked (jti mismatch)", async () => {
        const deps = makeDeps();
        deps.jwtService.verifyRefresh.mockReturnValue({ uid: "u1", jti: "old" });
        deps.refreshTokenStore.matches.mockResolvedValue(false);

        const uc = new RefreshToken(deps.jwtService, deps.userRepository, deps.refreshTokenStore);

        await expect(uc.execute("RT")).rejects.toThrow("Refresh token revoked");
    });

    test("throws if user not found", async () => {
        const deps = makeDeps();
        deps.jwtService.verifyRefresh.mockReturnValue({ uid: "u1", jti: "cur" });
        deps.refreshTokenStore.matches.mockResolvedValue(true);
        deps.userRepository.findById.mockResolvedValue(null);

        const uc = new RefreshToken(deps.jwtService, deps.userRepository, deps.refreshTokenStore);

        await expect(uc.execute("RT")).rejects.toThrow("User not found");
    });

    test("mints new tokens and rotates jti baseline", async () => {
        const deps = makeDeps();
        deps.jwtService.verifyRefresh.mockReturnValueOnce({ uid: "u1", jti: "cur" });
        deps.refreshTokenStore.matches.mockResolvedValue(true);
        deps.userRepository.findById.mockResolvedValue({ id: "u1", username: "alice" });

        deps.jwtService.generate.mockReturnValue("NEW_ACCESS");
        deps.jwtService.generateRefreshToken.mockReturnValue("NEW_REFRESH");

        // verifyRefresh called again on the new refresh token to get its jti
        deps.jwtService.verifyRefresh.mockReturnValueOnce({ uid: "u1", jti: "newjti" });

        const uc = new RefreshToken(deps.jwtService, deps.userRepository, deps.refreshTokenStore);

        const res = await uc.execute("RT");

        expect(deps.jwtService.generate).toHaveBeenCalledWith(
            { uid: "u1", username: "alice", role: "user" },
            "15m"
        );

        expect(deps.jwtService.generateRefreshToken).toHaveBeenCalledWith(
            { uid: "u1", username: "alice", role: "user" },
            "7d"
        );

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith(
            "u1",
            "newjti",
            7 * 24 * 60 * 60
        );

        expect(res).toEqual({
            user: { id: "u1", username: "alice" },
            accessToken: "NEW_ACCESS",
            refreshToken: "NEW_REFRESH",
        });
    });
});
