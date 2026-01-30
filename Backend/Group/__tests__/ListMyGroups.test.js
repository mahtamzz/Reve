const ListMyGroups = require("../application/useCases/MemberRelated/ListMyGroups");

describe("ListMyGroups", () => {
    test("requires uid", async () => {
        const groupMemberRepo = { getUserGroups: jest.fn() };
        const uc = new ListMyGroups(groupMemberRepo);

        await expect(uc.execute("")).rejects.toThrow("uid is required");
    });

    test("delegates to groupMemberRepo.getUserGroups", async () => {
        const groupMemberRepo = { getUserGroups: jest.fn().mockResolvedValue([{ id: "g1" }]) };
        const uc = new ListMyGroups(groupMemberRepo);

        await expect(uc.execute("u1")).resolves.toEqual([{ id: "g1" }]);
        expect(groupMemberRepo.getUserGroups).toHaveBeenCalledWith("u1");
    });
});
