const SearchGroups = require("../application/useCases/DetailsRelated/SearchGroups");

describe("SearchGroups", () => {
    test("returns [] if q missing/blank", async () => {
        const groupRepo = { searchDiscoverable: jest.fn() };
        const uc = new SearchGroups(groupRepo);

        await expect(uc.execute({ viewerUid: "u1", q: "", limit: 10, offset: 0 }))
            .resolves.toEqual([]);

        await expect(uc.execute({ viewerUid: "u1", q: "   ", limit: 10, offset: 0 }))
            .resolves.toEqual([]);

        expect(groupRepo.searchDiscoverable).not.toHaveBeenCalled();
    });

    test("trims q and delegates to groupRepo.searchDiscoverable", async () => {
        const groupRepo = { searchDiscoverable: jest.fn() };
        groupRepo.searchDiscoverable.mockResolvedValue([{ id: "g1" }]);

        const uc = new SearchGroups(groupRepo);

        const res = await uc.execute({ viewerUid: "u1", q: "  math ", limit: 10, offset: 0 });

        expect(groupRepo.searchDiscoverable).toHaveBeenCalledWith({
            viewerUid: "u1",
            q: "math",
            limit: 10,
            offset: 0,
        });

        expect(res).toEqual([{ id: "g1" }]);
    });
});
