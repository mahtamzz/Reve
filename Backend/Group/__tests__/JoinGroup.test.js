const JoinGroup = require("../application/useCases/DetailsRelated/JoinGroup");

describe("JoinGroup", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function makeDeps(overrides = {}) {
        return {
            groupRepo: { findById: jest.fn() },
            groupMemberRepo: { getRole: jest.fn(), addMember: jest.fn() },
            joinRequestRepo: { create: jest.fn() },
            banRepo: { isBanned: jest.fn() },
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("throws if group not found", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue(null);

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" })).rejects.toThrow("Group not found");
    });

    test("throws if banned", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });
        deps.banRepo.isBanned.mockResolvedValue(true);

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" }))
            .rejects.toThrow("You are banned from this group");
    });

    test("throws if already member", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });
        deps.banRepo.isBanned.mockResolvedValue(false);
        deps.groupMemberRepo.getRole.mockResolvedValue("member");

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" }))
            .rejects.toThrow("Already a member");
    });

    test("public group: adds member and publishes member.added", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });
        deps.banRepo.isBanned.mockResolvedValue(false);
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        const res = await uc.execute({ uid: "u1", groupId: "g1" });

        expect(deps.groupMemberRepo.addMember).toHaveBeenCalledWith("g1", "u1", "member");

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.added", {
            groupId: "g1",
            uid: "u1",
            at: "2026-01-05T10:00:00.000Z",
            reason: "joined_public",
        });

        expect(res).toEqual({ status: "joined" });
    });

    test("private group: creates join request and publishes join_request.created", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });
        deps.banRepo.isBanned.mockResolvedValue(false);
        deps.groupMemberRepo.getRole.mockResolvedValue(null);
        deps.joinRequestRepo.create.mockResolvedValue({ id: "jr1" });

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        const res = await uc.execute({ uid: "u1", groupId: "g1" });

        expect(deps.joinRequestRepo.create).toHaveBeenCalledWith("g1", "u1");

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.join_request.created", {
            groupId: "g1",
            uid: "u1",
            requestId: "jr1",
            at: "2026-01-05T10:00:00.000Z",
            reason: "requested_private",
        });

        expect(res).toEqual({ status: "requested" });
    });

    test("unknown visibility -> throws Invite-only group", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "invite" });
        deps.banRepo.isBanned.mockResolvedValue(false);
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new JoinGroup(deps.groupRepo, deps.groupMemberRepo, deps.joinRequestRepo, deps.banRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" }))
            .rejects.toThrow("Invite-only group");
    });
});
