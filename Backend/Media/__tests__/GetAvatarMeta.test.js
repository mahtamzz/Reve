const GetAvatarMeta = require("../application/useCases/GetAvatarMeta");

describe("GetAvatarMeta", () => {
    test("requires uid", async () => {
        const avatarRepo = { findByUid: jest.fn() };
        const uc = new GetAvatarMeta(avatarRepo);

        await expect(uc.execute("")).rejects.toThrow("uid is required");
    });

    test("returns repo result", async () => {
        const avatarRepo = { findByUid: jest.fn().mockResolvedValue({ uid: "u1", file_path: "a.png" }) };
        const uc = new GetAvatarMeta(avatarRepo);

        await expect(uc.execute("u1")).resolves.toEqual({ uid: "u1", file_path: "a.png" });
        expect(avatarRepo.findByUid).toHaveBeenCalledWith("u1");
    });
});
