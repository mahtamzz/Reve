const GetCurrentUser = require("../application/useCases/users/GetCurrentUser");

function makeDeps(overrides = {}) {
    return {
        userRepo: { findById: jest.fn() },
        ...overrides,
    };
}

describe("GetCurrentUser", () => {
    test("throws if user not found", async () => {
        const deps = makeDeps();
        deps.userRepo.findById.mockResolvedValue(null);

        const uc = new GetCurrentUser(deps);

        await expect(uc.execute("u1")).rejects.toThrow("User not found");
    });

    test("returns user if found", async () => {
        const deps = makeDeps();
        deps.userRepo.findById.mockResolvedValue({ id: "u1", email: "a@test.com" });

        const uc = new GetCurrentUser(deps);

        await expect(uc.execute("u1")).resolves.toEqual({ id: "u1", email: "a@test.com" });
    });
});
