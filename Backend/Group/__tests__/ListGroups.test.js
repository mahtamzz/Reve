const ListGroups = require("../application/useCases/DetailsRelated/ListGroups");

describe("ListGroups", () => {
    test("delegates to groupRepo.listDiscoverable", async () => {
        const groupRepo = { listDiscoverable: jest.fn() };
        groupRepo.listDiscoverable.mockResolvedValue([{ id: "g1" }]);

        const uc = new ListGroups(groupRepo);

        const res = await uc.execute({ viewerUid: "u1", limit: 10, offset: 0 });

        expect(groupRepo.listDiscoverable).toHaveBeenCalledWith({ viewerUid: "u1", limit: 10, offset: 0 });
        expect(res).toEqual([{ id: "g1" }]);
    });
});
