require("dotenv").config();

const PgClient = require("./infrastructure/db/postgres");

/* SHARED AUTH */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");
const requireUser = require("../shared/auth/requireUser");
const requireAdmin = require("../shared/auth/requireAdmin");

/* REPOSITORIES */
const PgGroupRepo = require("./infrastructure/repositories/PgGroupRepo");
const PgGroupMemberRepo = require("./infrastructure/repositories/PgGroupMemberRepo");
const PgJoinRequestRepo = require("./infrastructure/repositories/PgGroupJoinRequestRepo");
const PgBanRepo = require("./infrastructure/repositories/PgGroupBanRepo");
const PgAuditRepo = require("./infrastructure/repositories/PgGroupAuditRepo");

/* EVENTS */
const EventBus = require("./infrastructure/messaging/EventBus");

/* CLIENTS */
const UserProfileClient = require("./infrastructure/UserProfileClient");

/* USE CASES */
const CreateGroup = require("./application/useCases/DetailsRelated/CreateGroup");
const DeleteGroup = require("./application/useCases/DetailsRelated/DeleteGroup");
const GetGroupDetails = require("./application/useCases/DetailsRelated/GetGroupDetails");
const JoinGroup = require("./application/useCases/DetailsRelated/JoinGroup");
const LeaveGroup = require("./application/useCases/DetailsRelated/LeaveGroup");
const UpdateGroup = require("./application/useCases/DetailsRelated/UpdateGroup");
const ListGroups = require("./application/useCases/DetailsRelated/ListGroups");
const SearchGroups = require("./application/useCases/DetailsRelated/SearchGroups");

const ApproveJoinRequest = require("./application/useCases/MemberRelated/ApproveJoinRequest");
const RejectJoinRequest = require("./application/useCases/MemberRelated/RejectJoinRequest");
const ChangeMemberRole = require("./application/useCases/MemberRelated/ChangeMemberRole");
const KickMember = require("./application/useCases/MemberRelated/KickMember");
const GetMyMembership = require("./application/useCases/MemberRelated/GetMyMembership");
const ListMyGroups = require("./application/useCases/MemberRelated/ListMyGroups");
const ListJoinRequests = require("./application/useCases/MemberRelated/ListJoinRequests");
const ListGroupMembers = require("./application/useCases/MemberRelated/ListGroupMembers");

/* ADMIN */
const AdminListGroups = require("./application/useCases/Admin/AdminListGroups");

/* CONTROLLER + ROUTES */
const createGroupController = require("./interfaces/http/controllers/groupController");
const createGroupRoutes = require("./interfaces/http/routes/groupRoutes");

async function createContainer() {
    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432
    });

    const groupRepo = new PgGroupRepo(db);
    const groupMemberRepo = new PgGroupMemberRepo(db);
    const joinRequestRepo = new PgJoinRequestRepo(db);
    const banRepo = new PgBanRepo(db);
    const auditRepo = new PgAuditRepo(db);

    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    const auth = authMiddleware(jwtVerifier); // ✅ correct name

    const eventBus = new EventBus(process.env.RABBITMQ_URL, { exchange: "group.events" });
    await eventBus.connect();

    const userProfileClient = new UserProfileClient({
        baseUrl: process.env.USER_PROFILE_BASE_URL
    });

    /* USE CASES */
    const createGroup = new CreateGroup({ groupRepo, membershipRepo: groupMemberRepo, auditRepo, eventBus });
    const deleteGroup = new DeleteGroup(groupRepo, groupMemberRepo, auditRepo, eventBus);
    const getGroupDetails = new GetGroupDetails(groupRepo, groupMemberRepo);
    const joinGroup = new JoinGroup(groupRepo, groupMemberRepo, joinRequestRepo, banRepo, eventBus);
    const leaveGroup = new LeaveGroup(groupMemberRepo, groupRepo, eventBus);
    const updateGroup = new UpdateGroup(groupRepo, groupMemberRepo, auditRepo);
    const listGroups = new ListGroups(groupRepo);
    const searchGroups = new SearchGroups(groupRepo);

    const approveJoinRequest = new ApproveJoinRequest(groupMemberRepo, joinRequestRepo, auditRepo, eventBus);
    const rejectJoinRequest = new RejectJoinRequest(joinRequestRepo, groupMemberRepo, auditRepo);
    const changeMemberRole = new ChangeMemberRole(groupMemberRepo, auditRepo);
    const kickMember = new KickMember(groupMemberRepo, auditRepo, eventBus);
    const getMyMembership = new GetMyMembership(groupMemberRepo);
    const listMyGroups = new ListMyGroups(groupMemberRepo);
    const listJoinRequests = new ListJoinRequests(groupMemberRepo, joinRequestRepo);
    const listGroupMembers = new ListGroupMembers(groupRepo, groupMemberRepo, userProfileClient);

    const adminListGroups = new AdminListGroups(groupRepo);

    const controller = createGroupController({
        createGroup,
        deleteGroup,
        getGroupDetails,
        joinGroup,
        leaveGroup,
        updateGroup,
        listGroups,
        listMyGroups,
        searchGroups,
        approveJoinRequest,
        rejectJoinRequest,
        changeMemberRole,
        kickMember,
        getMyMembership,
        listJoinRequests,
        listGroupMembers,
        adminListGroups
    });

    const groupRouter = createGroupRoutes({
        controller,
        auth,
        requireUser,
        requireAdmin
    });

    return { routers: { groupRouter } };
}

module.exports = createContainer;
