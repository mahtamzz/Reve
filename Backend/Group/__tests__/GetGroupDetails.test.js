const GetGroupDetails = require("../application/useCases/DetailsRelated/GetGroupDetails");

describe("GetGroupDetails", () => {
    function makeDeps(overrides = {}) {
        return {
            groupRepo: { findById: jest.fn() },
            groupMemberRepo: { getRole: jest.fn() },
            ...overrides,
        };
    }

    test("throws if group not found", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue(null);

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" }))
            .rejects.toThrow("Group not found");
    });

    test("admin gets group details with membership null", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        const res = await uc.execute({ actor: { role: "admin" }, groupId: "g1" });

        expect(res).toEqual({ group: { id: "g1", visibility: "private" }, membership: null });
        expect(deps.groupMemberRepo.getRole).not.toHaveBeenCalled();
    });

    test("private group: non-member is rejected", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        await expect(uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" }))
            .rejects.toThrow("Not a member");
    });

    test("private group: member gets membership role", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "private" });
        deps.groupMemberRepo.getRole.mockResolvedValue("member");

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        const res = await uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" });

        expect(res).toEqual({ group: { id: "g1", visibility: "private" }, membership: { role: "member" } });
    });

    test("public group: non-member gets membership null", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });
        deps.groupMemberRepo.getRole.mockResolvedValue(null);

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        const res = await uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" });

        expect(res).toEqual({ group: { id: "g1", visibility: "public" }, membership: null });
    });

    test("public group: member gets membership role", async () => {
        const deps = makeDeps();
        deps.groupRepo.findById.mockResolvedValue({ id: "g1", visibility: "public" });
        deps.groupMemberRepo.getRole.mockResolvedValue("admin");

        const uc = new GetGroupDetails(deps.groupRepo, deps.groupMemberRepo);

        const res = await uc.execute({ actor: { role: "user", uid: "u1" }, groupId: "g1" });

        expect(res).toEqual({ group: { id: "g1", visibility: "public" }, membership: { role: "admin" } });
    });
});
