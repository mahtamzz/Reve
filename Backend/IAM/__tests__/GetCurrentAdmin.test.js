const GetCurrentAdmin = require("../application/useCases/users/GetCurrentAdmin");

function makeDeps(overrides = {}) {
    return {
        adminRepo: { findById: jest.fn() },
        ...overrides,
    };
}

describe("GetCurrentAdmin", () => {
    test("throws if admin not found", async () => {
        const deps = makeDeps();
        deps.adminRepo.findById.mockResolvedValue(null);

        const uc = new GetCurrentAdmin(deps);

        await expect(uc.execute("a1")).rejects.toThrow("Admin not found");
    });

    test("returns admin if found", async () => {
        const deps = makeDeps();
        deps.adminRepo.findById.mockResolvedValue({ id: "a1", email: "admin@test.com" });

        const uc = new GetCurrentAdmin(deps);

        await expect(uc.execute("a1")).resolves.toEqual({ id: "a1", email: "admin@test.com" });
    });
});
