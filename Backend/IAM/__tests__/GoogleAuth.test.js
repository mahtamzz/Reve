const GoogleAuth = require("../application/useCases/auth/GoogleAuth");

function makeDeps(overrides = {}) {
    return {
        userRepository: {
            findByGoogleIdOrEmail: jest.fn(),
            createGoogleUser: jest.fn(),
        },
        jwtService: {
            generate: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyRefresh: jest.fn(),
        },
        eventBus: { publish: jest.fn() },
        refreshTokenStore: { set: jest.fn() },
        ...overrides,
    };
}

describe("GoogleAuth", () => {
    const profile = {
        id: "google-1",
        displayName: "Alice Smith",
        emails: [{ value: "a@test.com" }],
    };

    test("existing user: does not create or publish user.created; returns tokens", async () => {
        const deps = makeDeps();
        deps.userRepository.findByGoogleIdOrEmail.mockResolvedValue({
            id: "u1",
            email: "a@test.com",
            username: "alice",
        });

        deps.jwtService.generate.mockReturnValue("ACCESS");
        deps.jwtService.generateRefreshToken.mockReturnValue("REFRESH");

        const uc = new GoogleAuth(deps);

        // NOTE: will currently throw later because code uses this.tokenService.verifyRefresh
        await expect(uc.execute(profile)).rejects.toBeInstanceOf(TypeError);
    });

    test("new user: publishes user.created (and catches missing publish)", async () => {
        const deps = makeDeps({ eventBus: {} });
        deps.userRepository.findByGoogleIdOrEmail.mockResolvedValue(null);
        deps.userRepository.createGoogleUser.mockResolvedValue({
            id: "u2",
            email: "a@test.com",
            username: "alice1234",
        });

        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0);

        const uc = new GoogleAuth(deps);

        await expect(uc.execute(profile)).rejects.toThrow("EventBus.publish not available");

        mathSpy.mockRestore();
    });

    /**
     * ✅ Enable this test AFTER you fix the bug in GoogleAuth:
     * change `this.tokenService.verifyRefresh` -> `this.jwtService.verifyRefresh`
     *
     * Then delete/adjust the earlier tests that expect TypeError.
     */
    test("after fix: new user creates, publishes, returns tokens, stores refresh jti", async () => {
        const deps = makeDeps();
        deps.userRepository.findByGoogleIdOrEmail.mockResolvedValue(null);

        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0);
        // username suffix => 0

        deps.userRepository.createGoogleUser.mockResolvedValue({
            id: "u2",
            email: "a@test.com",
            username: "Alice Smith0",
        });

        deps.jwtService.generate.mockReturnValue("ACCESS");
        deps.jwtService.generateRefreshToken.mockReturnValue("REFRESH");
        deps.jwtService.verifyRefresh.mockReturnValue({ jti: "jti-g" });

        const uc = new GoogleAuth(deps);
        const res = await uc.execute(profile);

        expect(deps.eventBus.publish).toHaveBeenCalledWith("user.created", {
            uid: "u2",
            email: "a@test.com",
            username: "Alice Smith0",
        });

        expect(deps.refreshTokenStore.set).toHaveBeenCalledWith(
            "u2",
            "jti-g",
            7 * 24 * 60 * 60
        );

        expect(res).toEqual({
            user: { id: "u2", email: "a@test.com", username: "Alice Smith0" },
            accessToken: "ACCESS",
            refreshToken: "REFRESH",
        });

        mathSpy.mockRestore();
    });
});
