const ApproveJoinRequest = require("../application/useCases/MemberRelated/ApproveJoinRequest");

describe("ApproveJoinRequest", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
    });
    afterEach(() => jest.useRealTimers());

    function makeDeps(overrides = {}) {
        return {
            groupMemberRepo: { getRole: jest.fn(), addMember: jest.fn() },
            joinRequestRepo: { find: jest.fn(), delete: jest.fn() },
            auditRepo: { log: jest.fn() },
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("throws if actor not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new ApproveJoinRequest(deps.groupMemberRepo, deps.joinRequestRepo, deps.auditRepo, deps.eventBus);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Not a member");
    });

    test("throws if actor not owner/admin", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("member");

        const uc = new ApproveJoinRequest(deps.groupMemberRepo, deps.joinRequestRepo, deps.auditRepo, deps.eventBus);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Insufficient permissions");
    });

    test("throws if join request not found", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("admin");
        deps.joinRequestRepo.find.mockResolvedValue(null);

        const uc = new ApproveJoinRequest(deps.groupMemberRepo, deps.joinRequestRepo, deps.auditRepo, deps.eventBus);

        await expect(uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" }))
            .rejects.toThrow("Join request not found");
    });

    test("approves request: adds member, deletes request, audits, publishes member.added with int uid", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("owner");
        deps.joinRequestRepo.find.mockResolvedValue({ id: "jr1" });

        const uc = new ApproveJoinRequest(deps.groupMemberRepo, deps.joinRequestRepo, deps.auditRepo, deps.eventBus);

        await uc.execute({ actorUid: "1", targetUid: "2", groupId: "g1" });

        expect(deps.groupMemberRepo.addMember).toHaveBeenCalledWith("g1", "2", "member");
        expect(deps.joinRequestRepo.delete).toHaveBeenCalledWith("g1", "2");

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "1",
            action: "join_request.approved",
            targetUid: "2",
        });

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.added", {
            groupId: "g1",
            uid: 2, // parseInt("2", 10)
            at: "2026-01-05T10:00:00.000Z",
            reason: "approved",
        });
    });
});
