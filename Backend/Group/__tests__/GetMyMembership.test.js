const GetMyMembership = require("../application/useCases/MemberRelated/GetMyMembership");

describe("GetMyMembership", () => {
    test("validates groupId and uid", async () => {
        const groupMemberRepo = { getRole: jest.fn() };
        const uc = new GetMyMembership(groupMemberRepo);

        await expect(uc.execute({ groupId: "", uid: "u1" })).rejects.toThrow("groupId is required");
        await expect(uc.execute({ groupId: "g1", uid: "" })).rejects.toThrow("uid is required");
    });

    test("returns isMember false if no role", async () => {
        const groupMemberRepo = { getRole: jest.fn().mockResolvedValue(null) };
        const uc = new GetMyMembership(groupMemberRepo);

        await expect(uc.execute({ groupId: "g1", uid: "u1" })).resolves.toEqual({
            groupId: "g1",
            uid: "u1",
            isMember: false,
            role: null,
        });
    });

    test("returns isMember true if role exists", async () => {
        const groupMemberRepo = { getRole: jest.fn().mockResolvedValue("member") };
        const uc = new GetMyMembership(groupMemberRepo);

        await expect(uc.execute({ groupId: "g1", uid: "u1" })).resolves.toEqual({
            groupId: "g1",
            uid: "u1",
            isMember: true,
            role: "member",
        });
    });
});
