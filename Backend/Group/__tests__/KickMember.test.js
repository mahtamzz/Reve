jest.mock("../application/policies/canGroupAdminister", () => jest.fn());

const canGroupAdminister = require("../application/policies/canGroupAdminister");
const KickMember = require("../application/useCases/MemberRelated/KickMember");

describe("KickMember", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
        canGroupAdminister.mockReset();
    });
    afterEach(() => jest.useRealTimers());

    function makeDeps(overrides = {}) {
        return {
            groupMemberRepo: { getRole: jest.fn(), removeMember: jest.fn() },
            auditRepo: { log: jest.fn() },
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("non-platform actor must be member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValueOnce(null);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" })
        ).rejects.toThrow("Not a member");
    });

    test("denies if canGroupAdminister returns false", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValueOnce("member"); // actorRole
        canGroupAdminister.mockReturnValue(false);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" })
        ).rejects.toThrow("Insufficient permissions");
    });

    test("throws if target not a member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("admin") // actorRole
            .mockResolvedValueOnce(null);   // targetRole
        canGroupAdminister.mockReturnValue(true);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" })
        ).rejects.toThrow("Target not a member");
    });

    test("group-admin cannot kick owner", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("admin") // actorRole
            .mockResolvedValueOnce("owner"); // targetRole
        canGroupAdminister.mockReturnValue(true);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" })
        ).rejects.toThrow("Cannot kick owner");
    });

    test("admin cannot kick another admin (group-level)", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("admin") // actorRole
            .mockResolvedValueOnce("admin"); // targetRole
        canGroupAdminister.mockReturnValue(true);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" })
        ).rejects.toThrow("Admin cannot kick another admin");
    });

    test("platform admin bypasses group-level restrictions and membership check", async () => {
        const deps = makeDeps();
        // For platform admin, the code still fetches targetRole. Provide it.
        deps.groupMemberRepo.getRole.mockResolvedValueOnce("owner");
        canGroupAdminister.mockReturnValue(true);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await uc.execute({
            actor: { role: "admin", adminId: "a1", uid: null },
            targetUid: "2",
            groupId: "g1",
            reason: "policy",
        });

        expect(deps.groupMemberRepo.removeMember).toHaveBeenCalledWith("g1", "2");

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: null,
            action: "member.kicked",
            targetUid: "2",
            metadata: {
                platform_admin: true,
                admin_id: "a1",
                reason: "policy",
            },
        });

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.removed", {
            groupId: "g1",
            uid: 2,
            at: "2026-01-05T10:00:00.000Z",
            reason: "kicked",
        });
    });

    test("successful kick by group admin: removes member, audits, publishes removed", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole
            .mockResolvedValueOnce("admin")  // actorRole
            .mockResolvedValueOnce("member"); // targetRole
        canGroupAdminister.mockReturnValue(true);

        const uc = new KickMember(deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await uc.execute({ actor: { role: "user", uid: "u1" }, targetUid: "2", groupId: "g1" });

        expect(deps.groupMemberRepo.removeMember).toHaveBeenCalledWith("g1", "2");
        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.removed", {
            groupId: "g1",
            uid: 2,
            at: "2026-01-05T10:00:00.000Z",
            reason: "kicked",
        });
    });
});
