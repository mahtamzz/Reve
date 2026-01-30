const UpdateGroup = require("../application/useCases/DetailsRelated/UpdateGroup");

describe("UpdateGroup", () => {
    function makeDeps(overrides = {}) {
        return {
            groupRepo: { update: jest.fn() },
            groupMemberRepo: { getRole: jest.fn() },
            auditRepo: { log: jest.fn() },
            ...overrides,
        };
    }

    test("throws if not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new UpdateGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ uid: "u1", groupId: "g1", fields: { name: "x" } }))
            .rejects.toThrow("Not a member");
    });

    test("throws if insufficient permissions (not owner/admin)", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("member");

        const uc = new UpdateGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ uid: "u1", groupId: "g1", fields: { name: "x" } }))
            .rejects.toThrow("Insufficient permissions");
    });

    test("maps weeklyXp and minimumDstMins to snake_case for repo.update; logs audit; returns updated", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("owner");
        deps.groupRepo.update.mockResolvedValue({ id: "g1", weekly_xp: 10 });

        const uc = new UpdateGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo);

        const fields = { name: "New", weeklyXp: 10, minimumDstMins: 15 };
        const res = await uc.execute({ uid: "u1", groupId: "g1", fields });

        expect(deps.groupRepo.update).toHaveBeenCalledWith("g1", {
            name: "New",
            weekly_xp: 10,
            minimum_dst_mins: 15,
        });

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "u1",
            action: "group.updated",
            metadata: { fields },
        });

        expect(res).toEqual({ id: "g1", weekly_xp: 10 });
    });

    test("admin role in group can update too", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("admin");
        deps.groupRepo.update.mockResolvedValue({ id: "g1" });

        const uc = new UpdateGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ uid: "u1", groupId: "g1", fields: { description: "d" } }))
            .resolves.toEqual({ id: "g1" });

        expect(deps.auditRepo.log).toHaveBeenCalled();
    });
});
