class JoinGroup {
    constructor(groupRepo, groupMemberRepo, joinRequestRepo, banRepo, eventBus) {
      this.groupRepo = groupRepo;
      this.groupMemberRepo = groupMemberRepo;
      this.joinRequestRepo = joinRequestRepo;
      this.banRepo = banRepo;
      this.eventBus = eventBus;
    }
  
    async execute({ uid, groupId }) {
      const group = await this.groupRepo.findById(groupId);
      if (!group) throw new Error("Group not found");
  
      const banned = await this.banRepo.isBanned(groupId, uid);
      if (banned) throw new Error("You are banned from this group");
  
      const existingRole = await this.groupMemberRepo.getRole(groupId, uid);
      if (existingRole) throw new Error("Already a member");
  
      if (group.visibility === "public") {
        await this.groupMemberRepo.addMember(groupId, uid, "member");
  
        await this.eventBus.publish("group.member.added", {
          groupId,
          uid,
          at: new Date().toISOString(),
          reason: "joined_public"
        });
  
        return { status: "joined" };
      }
  
      if (group.visibility === "private") {
        const req = await this.joinRequestRepo.create(groupId, uid);
  
        await this.eventBus.publish("group.join_request.created", {
          groupId,
          uid,
          requestId: req?.id ?? null,
          at: new Date().toISOString(),
          reason: "requested_private"
        });
  
        return { status: "requested" };
      }
  
      throw new Error("Invite-only group");
    }
  }
  
  module.exports = JoinGroup;
  