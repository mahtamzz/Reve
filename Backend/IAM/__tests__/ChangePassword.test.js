const ChangePassword = require("../application/useCases/users/ChangePassword");

function makeDeps(overrides = {}) {
    return {
        userRepo: {
            findAuthById: jest.fn(),
            updatePasswordHashById: jest.fn(),
        },
        hasher: {
            compare: jest.fn(),
            hash: jest.fn(),
        },
        ...overrides,
    };
}

describe("ChangePassword", () => {
    test("requires uid", async () => {
        const deps = makeDeps();
        const uc = new ChangePassword(deps);

        await expect(uc.execute({ uid: "", current_password: "a", new_password: "bbbbbbbb" }))
            .rejects.toThrow("uid required");
    });

    test("requires string passwords", async () => {
        const deps = makeDeps();
        const uc = new ChangePassword(deps);

        await expect(uc.execute({ uid: "u1", current_password: null, new_password: "bbbbbbbb" }))
            .rejects.toThrow("current_password and new_password required");
    });

    test("enforces new_password length >= 8", async () => {
        const deps = makeDeps();
        const uc = new ChangePassword(deps);

        await expect(uc.execute({ uid: "u1", current_password: "old", new_password: "short" }))
            .rejects.toThrow("new_password must be at least 8 characters");
    });

    test("throws if user not found", async () => {
        const deps = makeDeps();
        deps.userRepo.findAuthById.mockResolvedValue(null);

        const uc = new ChangePassword(deps);

        await expect(uc.execute({ uid: "u1", current_password: "oldpass", new_password: "newpassss" }))
            .rejects.toThrow("User not found");
    });

    test("throws CURRENT_PASSWORD_INCORRECT if compare fails", async () => {
        const deps = makeDeps();
        deps.userRepo.findAuthById.mockResolvedValue({ id: "u1", password: "HASH" });
        deps.hasher.compare.mockResolvedValue(false);

        const uc = new ChangePassword(deps);

        await expect(uc.execute({ uid: "u1", current_password: "bad", new_password: "newpassss" }))
            .rejects.toThrow("CURRENT_PASSWORD_INCORRECT");

        expect(deps.userRepo.updatePasswordHashById).not.toHaveBeenCalled();
    });

    test("hashes new password and updates repo", async () => {
        const deps = makeDeps();
        deps.userRepo.findAuthById.mockResolvedValue({ id: "u1", password: "HASH" });
        deps.hasher.compare.mockResolvedValue(true);
        deps.hasher.hash.mockResolvedValue("NEWHASH");

        const uc = new ChangePassword(deps);

        await uc.execute({ uid: "u1", current_password: "oldpass", new_password: "newpassss" });

        expect(deps.userRepo.updatePasswordHashById).toHaveBeenCalledWith("u1", "NEWHASH");
    });
});
