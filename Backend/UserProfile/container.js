const PgClient = require("./infrastructure/db/postgres");

/* SHARED */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");
const auditMiddleware = require("../shared/audit/auditMiddleware");

/* REPOS */
const PgUserProfileRepo = require("./infrastructure/repositories/PgUserProfileRepo");
const PgPreferencesRepo = require("./infrastructure/repositories/PgPreferencesRepo");
const PgUserDSTRepo = require("./infrastructure/repositories/PgUserDSTRepo");
const PgAuditRepo = require("./infrastructure/repositories/PgAuditRepo");

/* USE CASES */
const CreateUserProfile = require("./application/useCases/CreateUserProfile");
const GetUserProfile = require("./application/useCases/GetUserProfile");
const UpdateUserProfile = require("./application/useCases/UpdateUserProfile");
const UpdateUserPreferences = require("./application/useCases/UpdateUserPreferences");
const GetDashboard = require("./application/useCases/GetDashboard");

/* CONTROLLERS */
const UserProfileController = require("./interfaces/http/controllers/UserProfileController");

/* ROUTES */
const createProfileRouter = require("./interfaces/http/routes/profile.routes.js");

/* EVENTS */
const UserEventsConsumer = require("./infrastructure/messaging/UserEventsConsumer");

async function createContainer() {

    /* DB */
    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    });

    /* REPOSITORIES */
    const profileRepo = new PgUserProfileRepo({ pool: db });
    const prefsRepo = new PgPreferencesRepo({ pool: db });
    const dailyRepo = new PgUserDSTRepo({ pool: db });
    const auditRepo = new PgAuditRepo({ pool: db });

    /* JWT */
    const jwtVerifier = new JwtVerifier({
        secret: process.env.JWT_SECRET,
        issuer: process.env.JWT_ISSUER,
        audience: 'profile-service'
    });

    const auth = authMiddleware(jwtVerifier);

    /* USE CASES */
    const createUserProfileUC = new CreateUserProfile(
        profileRepo,
        prefsRepo,
        auditRepo
    );

    const getUserProfileUC = new GetUserProfile(profileRepo, prefsRepo);
    const updateUserProfileUC = new UpdateUserProfile(profileRepo, auditRepo);
    const updateUserPreferencesUC = new UpdateUserPreferences(prefsRepo, auditRepo);
    const getDashboardUC = new GetDashboard(profileRepo, dailyRepo);

    /* CONTROLLER */
    const userProfileController = new UserProfileController({
        getProfile: getUserProfileUC,
        updateProfile: updateUserProfileUC,
        updatePreferences: updateUserPreferencesUC,
        getDashboard: getDashboardUC
    });

    /* ROUTER */
    const profileRouter = createProfileRouter({
        auth,
        audit: (action) => auditMiddleware(auditRepo, action),
        controller: userProfileController
    });

    /* EVENT CONSUMER */
    const userEventsConsumer = new UserEventsConsumer(
        process.env.RABBITMQ_URL,
        createUserProfileUC
    );

    return {
        routers: {
            profileRouter
        },
        consumers: {
            userEventsConsumer
        }
    };
}

module.exports = createContainer;
