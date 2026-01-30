const ForgotPassword = require("../application/useCases/auth/ForgotPassword");

function makeDeps(overrides = {}) {
    return {
        userRepo: { findByEmail: jest.fn() },
        cache: { set: jest.fn() },
        emailService: { send: jest.fn() },
        ...overrides,
    };
}

describe("ForgotPassword", () => {
    test("throws if user not found", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue(null);

        const uc = new ForgotPassword(deps);

        await expect(uc.execute({ email: "a@test.com" }))
            .rejects.toThrow("User not found or not verified");

        expect(deps.cache.set).not.toHaveBeenCalled();
        expect(deps.emailService.send).not.toHaveBeenCalled();
    });

    test("stores reset otp for 600s and emails it", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1" });

        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0); // otp => 100000

        const uc = new ForgotPassword(deps);
        const res = await uc.execute({ email: "a@test.com" });

        expect(deps.cache.set).toHaveBeenCalledWith("reset:a@test.com", "100000", 600);
        expect(deps.emailService.send).toHaveBeenCalledWith(
            "a@test.com",
            "Password Reset OTP",
            "100000"
        );
        expect(res).toEqual({ message: "Password reset OTP sent" });

        mathSpy.mockRestore();
    });
});
