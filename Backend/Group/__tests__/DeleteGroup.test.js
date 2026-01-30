const DeleteGroup = require("../application/useCases/DetailsRelated/DeleteGroup");

describe("DeleteGroup", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function makeDeps(overrides = {}) {
        return {
            groupRepo: { findById: jest.fn(), delete: jest.fn() },
            groupMemberRepo: {}, // not used by this UC currently
            auditRepo: { log: jest.fn() },
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("throws if group not found", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue(null);

        const uc = new DeleteGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { type: "user", uid: "u1", role: "user" }, groupId: "g1" })
        ).rejects.toThrow("Group not found");

        expect(deps.auditRepo.log).not.toHaveBeenCalled();
        expect(deps.groupRepo.delete).not.toHaveBeenCalled();
    });

    test("denies delete if not platform admin and not owner", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", owner_uid: "owner1" });

        const uc = new DeleteGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await expect(
            uc.execute({ actor: { type: "user", uid: "u1", role: "user" }, groupId: "g1" })
        ).rejects.toThrow("Insufficient permissions");

        expect(deps.groupRepo.delete).not.toHaveBeenCalled();
    });

    test("owner can delete: logs audit, deletes, publishes group.deleted", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", owner_uid: "u1" });

        const uc = new DeleteGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await uc.execute({ actor: { type: "user", uid: "u1", role: "user" }, groupId: "g1", reason: "cleanup" });

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "u1",
            action: "group.deleted",
            targetUid: "u1",
            metadata: {
                platform_admin: false,
                admin_id: null,
                reason: "cleanup",
            },
        });

        expect(deps.groupRepo.delete).toHaveBeenCalledWith("g1");

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.deleted", {
            groupId: "g1",
            at: "2026-01-05T10:00:00.000Z",
            by: { type: "user", uid: "u1" },
        });
    });

    test("platform admin can delete: audit includes admin_id and publish by admin", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", owner_uid: "owner1" });

        const uc = new DeleteGroup(deps.groupRepo, deps.groupMemberRepo, deps.auditRepo, deps.eventBus);

        await uc.execute({
            actor: { type: "admin", role: "admin", uid: null, adminId: "a1" },
            groupId: "g1",
            reason: "abuse",
        });

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: null,
            action: "group.deleted",
            targetUid: "owner1",
            metadata: {
                platform_admin: true,
                admin_id: "a1",
                reason: "abuse",
            },
        });

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.deleted", {
            groupId: "g1",
            at: "2026-01-05T10:00:00.000Z",
            by: { type: "admin", adminId: "a1" },
        });
    });
});
