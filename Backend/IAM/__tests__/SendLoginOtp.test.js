const SendLoginOtp = require("../application/useCases/auth/SendLoginOtp");

function makeDeps(overrides = {}) {
    const deps = {
        userRepo: { findByEmail: jest.fn() },
        cache: { set: jest.fn() },
        emailService: { send: jest.fn() },
        ...overrides,
    };
    return deps;
}

describe("SendLoginOtp use case", () => {
    test("throws if email missing", async () => {
        const deps = makeDeps();
        const uc = new SendLoginOtp(deps);

        await expect(uc.execute({ email: "" })).rejects.toThrow("Email is required");
    });

    test("normalizes email and throws if user not found", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue(null);

        const uc = new SendLoginOtp(deps);

        await expect(uc.execute({ email: "  A@TEST.COM " }))
            .rejects.toThrow("User not found");

        expect(deps.userRepo.findByEmail).toHaveBeenCalledWith("a@test.com");
    });

    test("stores OTP for 120s and emails it", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1" });

        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0);

        const uc = new SendLoginOtp(deps);
        const res = await uc.execute({ email: "  A@TEST.COM " });

        expect(deps.cache.set).toHaveBeenCalledWith("login_otp:a@test.com", "100000", 120);
        expect(deps.emailService.send).toHaveBeenCalledWith("a@test.com", "Your OTP", "100000");
        expect(res).toEqual({ message: "OTP sent successfully" });

        mathSpy.mockRestore();
    });
});
