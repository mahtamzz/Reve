const RejectJoinRequest = require("../application/useCases/MemberRelated/RejectJoinRequest");

describe("RejectJoinRequest", () => {
    function makeDeps(overrides = {}) {
        return {
            joinRequestRepo: { find: jest.fn(), delete: jest.fn() },
            groupMemberRepo: { getRole: jest.fn() },
            auditRepo: { log: jest.fn() },
            ...overrides,
        };
    }

    test("throws if actor not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new RejectJoinRequest(deps.joinRequestRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Not a member");
    });

    test("throws if insufficient permissions", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("member");

        const uc = new RejectJoinRequest(deps.joinRequestRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Insufficient permissions");
    });

    test("throws if join request not found", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("admin");
        deps.joinRequestRepo.find.mockResolvedValue(null);

        const uc = new RejectJoinRequest(deps.joinRequestRepo, deps.groupMemberRepo, deps.auditRepo);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Join request not found");
    });

    test("rejects request: deletes request and logs audit", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("owner");
        deps.joinRequestRepo.find.mockResolvedValue({ id: "jr1" });

        const uc = new RejectJoinRequest(deps.joinRequestRepo, deps.groupMemberRepo, deps.auditRepo);

        await uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" });

        expect(deps.joinRequestRepo.delete).toHaveBeenCalledWith("g1", "2");
        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "1",
            action: "join_request.rejected",
            targetUid: "2",
        });
    });
});
