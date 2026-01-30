const ChangeMemberRole = require("../application/useCases/MemberRelated/ChangeMemberRole");

describe("ChangeMemberRole", () => {
    function makeDeps(overrides = {}) {
        return {
            groupMemberRepo: { getRole: jest.fn(), updateRole: jest.fn() },
            auditRepo: { log: jest.fn() },
            ...overrides,
        };
    }

    test("throws if actor not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValueOnce(null);

        const uc = new ChangeMemberRole(deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1", role: "admin" }))
            .rejects.toThrow("Not a member");
    });

    test("throws if actor not owner", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValueOnce("admin");

        const uc = new ChangeMemberRole(deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1", role: "admin" }))
            .rejects.toThrow("Only owner can change roles");
    });

    test("throws if target not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("owner") // actor role
            .mockResolvedValueOnce(null);   // target role

        const uc = new ChangeMemberRole(deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1", role: "admin" }))
            .rejects.toThrow("Target not a member");
    });

    test("throws if target is owner", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("owner")
            .mockResolvedValueOnce("owner");

        const uc = new ChangeMemberRole(deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1", role: "member" }))
            .rejects.toThrow("Cannot change owner role");
    });

    test("updates role and logs audit", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("owner")
            .mockResolvedValueOnce("member");

        const uc = new ChangeMemberRole(deps.groupMemberRepo, deps.auditRepo);

        await uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1", role: "admin" });

        expect(deps.groupMemberRepo.updateRole).toHaveBeenCalledWith("g1", "2", "admin");

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "1",
            action: "member.role_changed",
            targetUid: "2",
            metadata: { role: "admin" },
        });
    });
});
