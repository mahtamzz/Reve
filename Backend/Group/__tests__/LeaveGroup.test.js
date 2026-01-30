const LeaveGroup = require("../application/useCases/DetailsRelated/LeaveGroup");

describe("LeaveGroup", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-05T10:00:00.000Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function makeDeps(overrides = {}) {
        return {
            membershipRepo: { getRole: jest.fn(), removeMember: jest.fn() },
            groupRepo: {}, // not used
            eventBus: { publish: jest.fn() },
            ...overrides,
        };
    }

    test("throws if not a member", async () => {
        const deps = makeDeps();
        deps.membershipRepo.getRole.mockResolvedValue(null);

        const uc = new LeaveGroup(deps.membershipRepo, deps.groupRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" }))
            .rejects.toThrow("Not a member");
    });

    test("owner cannot leave", async () => {
        const deps = makeDeps();
        deps.membershipRepo.getRole.mockResolvedValue("owner");

        const uc = new LeaveGroup(deps.membershipRepo, deps.groupRepo, deps.eventBus);

        await expect(uc.execute({ uid: "u1", groupId: "g1" }))
            .rejects.toThrow("Owner must transfer ownership before leaving");

        expect(deps.membershipRepo.removeMember).not.toHaveBeenCalled();
    });

    test("member leaves: removes membership and publishes member.removed", async () => {
        const deps = makeDeps();
        deps.membershipRepo.getRole.mockResolvedValue("member");

        const uc = new LeaveGroup(deps.membershipRepo, deps.groupRepo, deps.eventBus);

        await uc.execute({ uid: "u1", groupId: "g1" });

        expect(deps.membershipRepo.removeMember).toHaveBeenCalledWith("g1", "u1");

        expect(deps.eventBus.publish).toHaveBeenCalledWith("group.member.removed", {
            groupId: "g1",
            uid: "u1",
            at: "2026-01-05T10:00:00.000Z",
            reason: "left",
        });
    });
});
