const PgClient = require("./infrastructure/db/postgres");

/* REPOSITORIES */
const PgGroupRepo = require("./infrastructure/repositories/PgGroupRepo");
const PgGroupMemberRepo = require("./infrastructure/repositories/PgGroupMemberRepo");
const PgGroupJoinRequestRepo = require("./infrastructure/repositories/PgGroupJoinRequestRepo");
const PgGroupBanRepo = require("./infrastructure/repositories/PgGroupBanRepo");
const PgGroupAuditRepo = require("./infrastructure/repositories/PgGroupAuditRepo");

/* USE CASES – Details */
const CreateGroup = require("./application/useCases/DetailsRelated/CreateGroup.js");
const GetGroupDetails = require("./application/useCases/DetailsRelated/GetGroupDetails");
const UpdateGroup = require("./application/useCases/DetailsRelated/UpdateGroup");
const DeleteGroup = require("./application/useCases/DetailsRelated/DeleteGroup");
const JoinGroup = require("./application/useCases/DetailsRelated/JoinGroup");
const LeaveGroup = require("./application/useCases/DetailsRelated/LeaveGroup");

/* USE CASES – Members */
const ApproveJoinRequest = require("./application/useCases/MemberRelated/ApproveJoinRequest");
const RejectJoinRequest = require("./application/useCases/MemberRelated/RejectJoinRequest");
const ChangeMemberRole = require("./application/useCases/MemberRelated/ChangeMemberRole");
// const PromoteMember = require("./application/useCases/MemberRelated/PromoteMember");
// const DemoteMember = require("./application/useCases/MemberRelated/DemoteMember");
const KickMember = require("./application/useCases/MemberRelated/KickMember");

/* CONTROLLERS */
const GroupController = require("./interfaces/http/controllers/GroupController");
const GroupMemberController = require("./interfaces/http/controllers/GroupMemberController");

async function createContainer() {

    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    });

    /* REPOSITORIES */
    const groupRepo = new PgGroupRepo({ pool: db });
    const groupMemberRepo = new PgGroupMemberRepo({ pool: db });
    const joinRequestRepo = new PgGroupJoinRequestRepo({ pool: db });
    const banRepo = new PgGroupBanRepo({ pool: db });
    const auditRepo = new PgGroupAuditRepo({ pool: db });

    /* USE CASES – Details */
    const createGroupUC = new CreateGroup(
        groupRepo,
        groupMemberRepo,
        auditRepo
    );

    const getGroupDetailsUC = new GetGroupDetails(
        groupRepo,
        groupMemberRepo
    );

    const updateGroupUC = new UpdateGroup(
        groupRepo,
        groupMemberRepo,
        auditRepo
    );

    const deleteGroupUC = new DeleteGroup(
        groupRepo,
        groupMemberRepo,
        auditRepo
    );

    const joinGroupUC = new JoinGroup(
        groupRepo,
        groupMemberRepo,
        joinRequestRepo,
        banRepo
    );

    const leaveGroupUC = new LeaveGroup(groupMemberRepo);

    /* USE CASES – Members */
    const approveJoinRequestUC = new ApproveJoinRequest(
        groupMemberRepo,
        joinRequestRepo,
        auditRepo
    );

    const rejectJoinRequestUC = new RejectJoinRequest(
        joinRequestRepo,
        groupMemberRepo,
        auditRepo
    );

    const changeMemberRoleUC = new ChangeMemberRole(
        groupMemberRepo,
        auditRepo
    );

    // const promoteMemberUC = new PromoteMember(
    //     groupMemberRepo,
    //     auditRepo
    // );

    // const demoteMemberUC = new DemoteMember(
    //     groupMemberRepo,
    //     auditRepo
    // );

    const kickMemberUC = new KickMember(
        groupMemberRepo,
        auditRepo
    );

    /* CONTROLLERS */
    const groupController = new GroupController({
        createGroup: createGroupUC,
        getGroupDetails: getGroupDetailsUC,
        updateGroup: updateGroupUC,
        deleteGroup: deleteGroupUC,
        joinGroup: joinGroupUC,
        leaveGroup: leaveGroupUC
    });

    const groupMemberController = new GroupMemberController({
        approveJoinRequest: approveJoinRequestUC,
        rejectJoinRequest: rejectJoinRequestUC,
        changeMemberRole: changeMemberRoleUC,
        promoteMember: promoteMemberUC,
        demoteMember: demoteMemberUC,
        kickMember: kickMemberUC
    });

    return {
        controllers: {
            groupController,
            groupMemberController
        }
    };
}

module.exports = createContainer;
