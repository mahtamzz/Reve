const DeleteAvatar = require("../application/useCases/DeleteAvatar");

describe("DeleteAvatar", () => {
    function makeDeps(overrides = {}) {
        return {
            avatarRepo: { findByUid: jest.fn(), deleteByUid: jest.fn() },
            storage: { deleteIfExists: jest.fn() },
            ...overrides,
        };
    }

    test("requires uid", async () => {
        const deps = makeDeps();
        const uc = new DeleteAvatar(deps);

        await expect(uc.execute("")).rejects.toThrow("uid is required");
    });

    test("returns false if no avatar exists", async () => {
        const deps = makeDeps();
        deps.avatarRepo.findByUid.mockResolvedValue(null);

        const uc = new DeleteAvatar(deps);
        const res = await uc.execute("u1");

        expect(res).toBe(false);
        expect(deps.storage.deleteIfExists).not.toHaveBeenCalled();
        expect(deps.avatarRepo.deleteByUid).not.toHaveBeenCalled();
    });

    test("deletes file then deletes db row and returns true", async () => {
        const deps = makeDeps();
        deps.avatarRepo.findByUid.mockResolvedValue({ uid: "u1", file_path: "avatars/u1.png" });

        const uc = new DeleteAvatar(deps);
        const res = await uc.execute("u1");

        expect(deps.storage.deleteIfExists).toHaveBeenCalledWith("avatars/u1.png");
        expect(deps.avatarRepo.deleteByUid).toHaveBeenCalledWith("u1");
        expect(res).toBe(true);
    });
});
