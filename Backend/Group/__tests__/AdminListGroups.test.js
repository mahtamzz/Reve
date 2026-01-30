const AdminListGroups = require("../application/useCases/Admin/AdminListGroups");

describe("AdminListGroups", () => {
    test("delegates to groupRepo.listAll", async () => {
        const groupRepo = { listAll: jest.fn().mockResolvedValue([{ id: "g1" }]) };
        const uc = new AdminListGroups(groupRepo);

        const res = await uc.execute({ limit: 10, offset: 0 });

        expect(groupRepo.listAll).toHaveBeenCalledWith({ limit: 10, offset: 0 });
        expect(res).toEqual([{ id: "g1" }]);
    });
});
