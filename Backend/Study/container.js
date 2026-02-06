// Study/container.js
require("dotenv").config();

const PgClient = require("./infrastructure/db/postgres");

/* REDIS */
const RedisClient = require("./infrastructure/cache/redis");
const createStudyPresenceStore = require("./infrastructure/cache/studyPresenceStore");

/* SHARED */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");
const requireUser = require("../shared/auth/requireUser");
const requireAdmin = require("../shared/auth/requireAdmin");

/* REPOS */
const PgSubjectRepo = require("./infrastructure/repositories/PgSubjectRepo");
const PgStudySessionRepo = require("./infrastructure/repositories/PgStudySessionRepo");
const PgSubjectDSTRepo = require("./infrastructure/repositories/PgSubjectDSTRepo");
const PgUserStudyStatsRepo = require("./infrastructure/repositories/PgUserStudyStatsRepo");
const PgStudyAuditRepo = require("./infrastructure/repositories/PgStudyAuditRepo");

/* USE CASES */
const CreateSubject = require("./application/useCases/CreateSubject");
const ListSubjects = require("./application/useCases/ListSubjects");
const UpdateSubject = require("./application/useCases/UpdateSubject");
const DeleteSubject = require("./application/useCases/DeleteSubject");

const LogStudySession = require("./application/useCases/LogStudySession");
const ListStudySessions = require("./application/useCases/ListStudySessions");

const GetDashboard = require("./application/useCases/GetDashboard");
const UpdateWeeklyGoal = require("./application/useCases/UpdateWeeklyGoal");

/* CONTROLLER + ROUTES */
const StudyController = require("./interfaces/http/controllers/StudyController");
const createStudyRoutes = require("./interfaces/http/routes/study.routes");

/* GROUP CLIENT (for realtime broadcast to all groups user belongs to) */
const GroupClient = require("./infrastructure/group/GroupClient");

async function createContainer() {
    /* DB */
    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: process.env.PGPORT || 5432
    });

    /* REDIS */
    const redisClient = new RedisClient({
        host: process.env.REDIS_HOST || "redis",
        port: process.env.REDIS_PORT || 6379
    });
    const redis = await redisClient.connect();

    // Study presence (online == studying)
    const studyPresenceStore = createStudyPresenceStore(redis, {
        ttlSeconds: Number(process.env.STUDY_PRESENCE_TTL_SECONDS || 75),
        hbIntervalMs: Number(process.env.STUDY_PRESENCE_HB_INTERVAL_MS || 25000)
    });

    /* REPOSITORIES */
    const subjectRepo = new PgSubjectRepo(db);
    const sessionRepo = new PgStudySessionRepo(db);
    const subjectDstRepo = new PgSubjectDSTRepo(db);
    const statsRepo = new PgUserStudyStatsRepo(db);
    const auditRepo = new PgStudyAuditRepo(db);

    /* GROUP CLIENT */
    const groupClient = new GroupClient({
        baseUrl: process.env.GROUP_SERVICE_URL
    });

    /* JWT */
    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    const auth = authMiddleware(jwtVerifier);

    /* USE CASES */
    const createSubjectUC = new CreateSubject(subjectRepo, auditRepo);
    const listSubjectsUC = new ListSubjects(subjectRepo);
    const updateSubjectUC = new UpdateSubject(subjectRepo, auditRepo);
    const deleteSubjectUC = new DeleteSubject(subjectRepo, auditRepo);

    const logStudySessionUC = new LogStudySession({
        sessionRepo,
        subjectDstRepo,
        statsRepo,
        auditRepo,
        subjectRepo
    });

    const listStudySessionsUC = new ListStudySessions(sessionRepo);

    const getDashboardUC = new GetDashboard({
        subjectRepo,
        subjectDstRepo,
        statsRepo
    });

    const updateWeeklyGoalUC = new UpdateWeeklyGoal(statsRepo, auditRepo);

    /* CONTROLLER */
    const controller = new StudyController({
        createSubject: createSubjectUC,
        listSubjects: listSubjectsUC,
        updateSubject: updateSubjectUC,
        deleteSubject: deleteSubjectUC,
        logStudySession: logStudySessionUC,
        listStudySessions: listStudySessionsUC,
        getDashboard: getDashboardUC,
        updateWeeklyGoal: updateWeeklyGoalUC,
        studyPresenceStore,
        subjectDstRepo,
    });

    /* ROUTER */
    const studyRouter = createStudyRoutes({ auth, controller, requireUser, requireAdmin });

    return {
        repos: {
            subjectRepo,
            sessionRepo,
            subjectDstRepo,
            statsRepo,
            auditRepo
        },
        clients: {
            groupClient
        },
        cache: {
            redis
        },
        studyPresenceStore,
        routers: {
            studyRouter
        }
    };
}

module.exports = createContainer;
