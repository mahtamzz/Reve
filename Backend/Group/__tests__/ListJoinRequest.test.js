jest.mock("../application/policies/canGroupAdminister", () => jest.fn());

const canGroupAdminister = require("../application/policies/canGroupAdminister");
const ListJoinRequests = require("../application/useCases/MemberRelated/ListJoinRequests");

describe("ListJoinRequests", () => {
    beforeEach(() => canGroupAdminister.mockReset());

    function makeDeps(overrides = {}) {
        return {
            groupMemberRepo: { getRole: jest.fn() },
            joinRequestRepo: { listByGroup: jest.fn() },
            ...overrides,
        };
    }

    test("non-platform actor must be member", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new ListJoinRequests(deps.groupMemberRepo, deps.joinRequestRepo);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" }))
            .rejects.toThrow("Not a member");
    });

    test("denies if canGroupAdminister false", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("member");
        canGroupAdminister.mockReturnValue(false);

        const uc = new ListJoinRequests(deps.groupMemberRepo, deps.joinRequestRepo);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" }))
            .rejects.toThrow("Insufficient permissions");
    });

    test("returns join requests when authorized (group admin)", async () => {
        const deps = makeDeps();
        deps.groupMemberRepo.getRole.mockResolvedValue("admin");
        canGroupAdminister.mockReturnValue(true);
        deps.joinRequestRepo.listByGroup.mockResolvedValue([{ uid: "2" }]);

        const uc = new ListJoinRequests(deps.groupMemberRepo, deps.joinRequestRepo);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" }))
            .resolves.toEqual([{ uid: "2" }]);
    });

    test("platform admin skips membership check but still needs canGroupAdminister true", async () => {
        const deps = makeDeps();
        canGroupAdminister.mockReturnValue(true);
        deps.joinRequestRepo.listByGroup.mockResolvedValue([{ uid: "2" }]);

        const uc = new ListJoinRequests(deps.groupMemberRepo, deps.joinRequestRepo);

        await expect(uc.execute({ actor: { role: "admin", adminId: "a1", uid: null }, groupId: "g1" }))
            .resolves.toEqual([{ uid: "2" }]);

        expect(deps.groupMemberRepo.getRole).not.toHaveBeenCalled();
    });
});
