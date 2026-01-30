const CreateGroup = require("../application/useCases/DetailsRelated/CreateGroup");

describe("CreateGroup", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function makeDeps(overrides = {}) {
        return {
            groupRepo: { create: jest.fn() },
            membershipRepo: { addMember: jest.fn() },
            auditRepo: { log: jest.fn() },
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("creates group, adds owner membership, logs audit, publishes member.added, returns group", async () => {
        const deps = makeDeps();
        deps.groupRepo.create.mockResolvedValue({ id: "g1", name: "My Group" });

        const uc = new CreateGroup(deps);

        const result = await uc.execute({
            uid: "u1",
            name: "My Group",
            description: "desc",
            visibility: "public",
            weeklyXp: 50,
            minimumDstMins: 10,
        });

        expect(deps.groupRepo.create).toHaveBeenCalledWith({
            name: "My Group",
            description: "desc",
            visibility: "public",
            weeklyXp: 50,
            minimumDstMins: 10,
            ownerUid: "u1",
        });

        expect(deps.membershipRepo.addMember).toHaveBeenCalledWith("g1", "u1", "owner");

        expect(deps.auditRepo.log).toHaveBeenCalledWith({
            groupId: "g1",
            actorUid: "u1",
            action: "group.created",
        });

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.added", {
            groupId: "g1",
            uid: "u1",
            at: "2026-01-05T10:00:00.000Z",
            reason: "created",
        });

        expect(result).toEqual({ id: "g1", name: "My Group" });
    });
});
