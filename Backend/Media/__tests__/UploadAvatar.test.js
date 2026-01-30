const UploadAvatar = require("../application/useCases/UploadAvatar");

describe("UploadAvatar", () => {
    function makeDeps(overrides = {}) {
        return {
            avatarRepo: {
                findByUid: jest.fn(),
                upsert: jest.fn(),
            },
            storage: {
                save: jest.fn(),
                deleteIfExists: jest.fn(),
            },
            ...overrides,
        };
    }

    test("validates uid", async () => {
        const deps = makeDeps();
        const uc = new UploadAvatar(deps);

        await expect(uc.execute("", { buffer: Buffer.from("x"), mimeType: "image/png" }))
            .rejects.toThrow("uid is required");
    });

    test("validates buffer is a Buffer", async () => {
        const deps = makeDeps();
        const uc = new UploadAvatar(deps);

        await expect(uc.execute("u1", { buffer: null, mimeType: "image/png" }))
            .rejects.toThrow("file buffer is required");

        await expect(uc.execute("u1", { buffer: "notbuffer", mimeType: "image/png" }))
            .rejects.toThrow("file buffer is required");
    });

    test("validates mimeType", async () => {
        const deps = makeDeps();
        const uc = new UploadAvatar(deps);

        await expect(uc.execute("u1", { buffer: Buffer.from("x"), mimeType: "" }))
            .rejects.toThrow("mimeType is required");
    });

    test("rejects oversized avatars with code AVATAR_TOO_LARGE", async () => {
        const deps = makeDeps();
        const uc = new UploadAvatar({ ...deps, maxBytes: 3 }); // tiny max for test

        const big = Buffer.from("1234"); // len 4

        try {
            await uc.execute("u1", { buffer: big, mimeType: "image/png" });
            throw new Error("Expected to throw");
        } catch (err) {
            expect(err.message).toMatch("Avatar too large");
            expect(err.code).toBe("AVATAR_TOO_LARGE");
        }

        expect(deps.storage.save).not.toHaveBeenCalled();
        expect(deps.avatarRepo.upsert).not.toHaveBeenCalled();
    });

    test("saves file, upserts db, returns row", async () => {
        const deps = makeDeps();
        deps.avatarRepo.findByUid.mockResolvedValue(null);

        deps.storage.save.mockResolvedValue({
            relativePath: "avatars/u1.png",
            sizeBytes: 2,
        });

        deps.avatarRepo.upsert.mockResolvedValue({
            uid: "u1",
            file_path: "avatars/u1.png",
            mime_type: "image/png",
            size_bytes: 2,
        });

        const uc = new UploadAvatar(deps);

        const res = await uc.execute("u1", { buffer: Buffer.from("ok"), mimeType: "image/png" });

        expect(deps.storage.save).toHaveBeenCalledWith("u1", { buffer: Buffer.from("ok"), mimeType: "image/png" });
        expect(deps.avatarRepo.upsert).toHaveBeenCalledWith("u1", "avatars/u1.png", "image/png", 2);

        // no old file deletion
        expect(deps.storage.deleteIfExists).not.toHaveBeenCalled();

        expect(res).toEqual({
            uid: "u1",
            file_path: "avatars/u1.png",
            mime_type: "image/png",
            size_bytes: 2,
        });
    });

    test("deletes old file if path changed", async () => {
        const deps = makeDeps();
        deps.avatarRepo.findByUid.mockResolvedValue({ uid: "u1", file_path: "avatars/old.png" });

        deps.storage.save.mockResolvedValue({
            relativePath: "avatars/new.png",
            sizeBytes: 2,
        });

        deps.avatarRepo.upsert.mockResolvedValue({ uid: "u1", file_path: "avatars/new.png" });

        const uc = new UploadAvatar(deps);

        await uc.execute("u1", { buffer: Buffer.from("ok"), mimeType: "image/png" });

        expect(deps.storage.deleteIfExists).toHaveBeenCalledWith("avatars/old.png");
    });

    test("does not delete old file if path unchanged", async () => {
        const deps = makeDeps();
        deps.avatarRepo.findByUid.mockResolvedValue({ uid: "u1", file_path: "avatars/same.png" });

        deps.storage.save.mockResolvedValue({
            relativePath: "avatars/same.png",
            sizeBytes: 2,
        });

        deps.avatarRepo.upsert.mockResolvedValue({ uid: "u1", file_path: "avatars/same.png" });

        const uc = new UploadAvatar(deps);

        await uc.execute("u1", { buffer: Buffer.from("ok"), mimeType: "image/png" });

        expect(deps.storage.deleteIfExists).not.toHaveBeenCalled();
    });
});
