const Register = require("../application/useCases/auth/Register");

function makeDeps(overrides = {}) {
    const deps = {
        userRepo: { findByEmail: jest.fn() },
        cache: { set: jest.fn() },
        emailService: { send: jest.fn() },
        hasher: { hash: jest.fn() },
        ...overrides,
    };
    return deps;
}

describe("Register use case", () => {
    test("throws if user already exists", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue({ id: "u1" });

        const uc = new Register(deps);

        await expect(
            uc.execute({ username: "a", email: "a@test.com", password: "pw" })
        ).rejects.toThrow("User already exists");
    });

    test("stores pending user + otp and sends email", async () => {
        const deps = makeDeps();
        deps.userRepo.findByEmail.mockResolvedValue(null);
        deps.hasher.hash.mockResolvedValue("HASHED");

        // Make OTP deterministic for test
        const mathSpy = jest.spyOn(Math, "random").mockReturnValue(0);
        // OTP becomes 100000 when random() == 0

        const uc = new Register(deps);
        const res = await uc.execute({ username: "alice", email: "a@test.com", password: "pw" });

        expect(deps.cache.set).toHaveBeenCalledWith(
            "pending_user:a@test.com",
            JSON.stringify({ username: "alice", email: "a@test.com", password: "HASHED" }),
            600
        );

        expect(deps.cache.set).toHaveBeenCalledWith("otp:a@test.com", "100000", 600);
        expect(deps.emailService.send).toHaveBeenCalledWith("a@test.com", "Your OTP", "100000");
        expect(res).toEqual({ message: "OTP sent to email" });

        mathSpy.mockRestore();
    });
});
