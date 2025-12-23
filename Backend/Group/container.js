require("dotenv").config();

const PgClient = require("./infrastructure/db/postgres");

/* SHARED */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");
const auditMiddleware = require("../shared/audit/auditMiddleware");

/* REPOSITORIES */
const PgGroupRepo = require("./infrastructure/repositories/PgGroupRepo");
const PgGroupMemberRepo = require("./infrastructure/repositories/PgGroupMemberRepo");
const PgJoinRequestRepo = require("./infrastructure/repositories/PgGroupJoinRequestRepo");
const PgBanRepo = require("./infrastructure/repositories/PgGroupBanRepo");
const PgAuditRepo = require("./infrastructure/repositories/PgGroupAuditRepo");

/* USE CASES – Details */
const CreateGroup = require("./application/useCases/DetailsRelated/CreateGroup");
const DeleteGroup = require("./application/useCases/DetailsRelated/DeleteGroup");
const GetGroupDetails = require("./application/useCases/DetailsRelated/GetGroupDetails");
const JoinGroup = require("./application/useCases/DetailsRelated/JoinGroup");
const LeaveGroup = require("./application/useCases/DetailsRelated/LeaveGroup");
const UpdateGroup = require("./application/useCases/DetailsRelated/UpdateGroup");

/* USE CASES – Members */
const ApproveJoinRequest = require("./application/useCases/MemberRelated/ApproveJoinRequest");
const RejectJoinRequest = require("./application/useCases/MemberRelated/RejectJoinRequest");
const ChangeMemberRole = require("./application/useCases/MemberRelated/ChangeMemberRole");
const KickMember = require("./application/useCases/MemberRelated/KickMember");

/* CONTROLLER + ROUTES */
const createGroupController = require("./interfaces/http/controllers/groupController");
const createGroupRoutes = require("./interfaces/http/routes/groupRoutes");

async function createContainer() {
    /* DB */
    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432
    });

    /* REPOSITORIES */
    const groupRepo = new PgGroupRepo(db);
    const groupMemberRepo = new PgGroupMemberRepo(db);
    const joinRequestRepo = new PgJoinRequestRepo(db);
    const banRepo = new PgBanRepo(db);
    const auditRepo = new PgAuditRepo(db);

    /* JWT */
    const jwtVerifier = new JwtVerifier({
        secret: process.env.JWT_SECRET
    });

    const auth = authMiddleware(jwtVerifier);

    /* USE CASES */
    const createGroup = new CreateGroup({
        groupRepo,
        membershipRepo: groupMemberRepo,
        auditRepo
    });

    const deleteGroup = new DeleteGroup(
        groupRepo,
        groupMemberRepo,
        auditRepo
    );

    const getGroupDetails = new GetGroupDetails(
        groupRepo,
        groupMemberRepo
    );

    const joinGroup = new JoinGroup(
        groupRepo,
        groupMemberRepo,
        joinRequestRepo,
        banRepo
    );

    const leaveGroup = new LeaveGroup(
        groupMemberRepo,
        groupRepo
    );

    const updateGroup = new UpdateGroup(
        groupRepo,
        groupMemberRepo,
        auditRepo
    );

    const approveJoinRequest = new ApproveJoinRequest(
        groupMemberRepo,
        joinRequestRepo,
        auditRepo
    );

    const rejectJoinRequest = new RejectJoinRequest(
        joinRequestRepo,
        groupMemberRepo,
        auditRepo
    );

    const changeMemberRole = new ChangeMemberRole(
        groupMemberRepo,
        auditRepo
    );

    const kickMember = new KickMember(
        groupMemberRepo,
        auditRepo
    );

    /* CONTROLLER */
    const controller = createGroupController({
        createGroup,
        deleteGroup,
        getGroupDetails,
        joinGroup,
        leaveGroup,
        updateGroup,
        approveJoinRequest,
        rejectJoinRequest,
        changeMemberRole,
        kickMember
    });

    /* ROUTER */
    const groupRouter = createGroupRoutes({
        controller,
        auth
    });

    return {
        routers: {
            groupRouter
        }
    };
}

module.exports = createContainer;
