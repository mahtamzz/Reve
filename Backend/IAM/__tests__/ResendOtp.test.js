const ResendOtp = require("../application/useCases/auth/ResendOtp");

function makeDeps(overrides = {}) {
    return {
        cache: { get: jest.fn(), set: jest.fn() },
        emailService: { send: jest.fn() },
        ...overrides,
    };
}

describe("ResendOtp", () => {
    test("throws if no pending registration", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue(null);

        const uc = new ResendOtp(deps);

        await expect(uc.execute({ email: "a@test.com" }))
            .rejects.toThrow("No registration pending for this email");

        expect(deps.cache.set).not.toHaveBeenCalled();
        expect(deps.emailService.send).not.toHaveBeenCalled();
    });

    test("sets new otp for 600s and emails it", async () => {
        const deps = makeDeps();
        deps.cache.get.mockResolvedValue(JSON.stringify({ email: "a@test.com" }));

        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0); // otp => 100000

        const uc = new ResendOtp(deps);
        const res = await uc.execute({ email: "a@test.com" });

        expect(deps.cache.set).toHaveBeenCalledWith("otp:a@test.com", "100000", 600);
        expect(deps.emailService.send).toHaveBeenCalledWith("a@test.com", "Your OTP", "100000");
        expect(res).toEqual({ message: "OTP resent to email" });

        mathSpy.mockRestore();
    });
});
