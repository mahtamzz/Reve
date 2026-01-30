const ListGroupMembers = require("../application/useCases/MemberRelated/ListGroupMembers");

describe("ListGroupMembers", () => {
    function makeDeps(overrides = {}) {
        return {
            groupRepo: { findById: jest.fn() },
            groupMemberRepo: { getRole: jest.fn(), getMembers: jest.fn() },
            userProfileClient: { getPublicProfilesBatch: jest.fn() },
            ...overrides,
        };
    }

    test("throws if group not found", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue(null);

        const uc = new ListGroupMembers(deps.groupRepo, deps.groupMemberRepo, deps.userProfileClient);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1", authHeader: "x" }))
            .rejects.toThrow("Group not found");
    });

    test("private group: non-admin must be member", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new ListGroupMembers(deps.groupRepo, deps.groupMemberRepo, deps.userProfileClient);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1", authHeader: "Bearer t" }))
            .rejects.toThrow("Not a member");
    });

    test("public group: non-admin can list without membership", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });

        deps.groupMemberRepo.getMembers.mockResolvedValue([
            { uid: 1, role: "owner", joined_at: "2026-01-01" },
            { uid: 2, role: "member", joined_at: "2026-01-02" },
        ]);

        deps.userProfileClient.getPublicProfilesBatch.mockResolvedValue([
            { uid: 1, display_name: "Alice", timezone: "Europe/Amsterdam" },
            { uid: 2, display_name: "Bob", timezone: null },
        ]);

        const uc = new ListGroupMembers(deps.groupRepo, deps.groupMemberRepo, deps.userProfileClient);

        const res = await uc.execute({ actor: { role: "user", uid: "u9" }, groupId: "g1", authHeader: "Bearer t" });

        expect(res).toEqual({
            groupId: "g1",
            total: 2,
            items: [
                {
                    uid: 1,
                    role: "owner",
                    joined_at: "2026-01-01",
                    profile: { display_name: "Alice", timezone: "Europe/Amsterdam" },
                },
                {
                    uid: 2,
                    role: "member",
                    joined_at: "2026-01-02",
                    profile: { display_name: "Bob", timezone: null },
                },
            ],
        });
    });

    test("if profile service fails, profiles become null but members still returned", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });

        deps.groupMemberRepo.getMembers.mockResolvedValue([{ uid: 1, role: "owner", joined_at: "2026-01-01" }]);
        deps.userProfileClient.getPublicProfilesBatch.mockRejectedValue(new Error("down"));

        const uc = new ListGroupMembers(deps.groupRepo, deps.groupMemberRepo, deps.userProfileClient);

        const res = await uc.execute({ actor: { role: "user", uid: "u9" }, groupId: "g1", authHeader: "Bearer t" });

        expect(res).toEqual({
            groupId: "g1",
            total: 1,
            items: [
                { uid: 1, role: "owner", joined_at: "2026-01-01", profile: null }
            ],
        });
    });

    test("admin can list even for private groups without membership check", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });
        deps.groupMemberRepo.getMembers.mockResolvedValue([{ uid: 1, role: "owner", joined_at: "2026-01-01" }]);
        deps.userProfileClient.getPublicProfilesBatch.mockResolvedValue([]);

        const uc = new ListGroupMembers(deps.groupRepo, deps.groupMemberRepo, deps.userProfileClient);

        const res = await uc.execute({ actor: { role: "admin", adminId: "a1" }, groupId: "g1", authHeader: "Bearer t" });

        expect(deps.groupMemberRepo.getRole).not.toHaveBeenCalled();
        expect(res.total).toBe(1);
    });
});
