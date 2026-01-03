const env = require("./config/env");
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
const PgFollowRepo = require("./infrastructure/repositories/PgFollowRepo");

/* USE CASES */
const CreateUserProfile = require("./application/useCases/CreateUserProfile");
const GetUserProfile = require("./application/useCases/GetUserProfile");
const UpdateUserProfile = require("./application/useCases/UpdateUserProfile");
const UpdateUserPreferences = require("./application/useCases/UpdateUserPreferences");
const GetDashboard = require("./application/useCases/GetDashboard");
const GetPublicProfilesBatch = require("./application/useCases/GetPublicProfilesBatch");

const FollowUser = require("./application/useCases/FollowUser");
const UnfollowUser = require("./application/useCases/UnfollowUser");
const ListFollowers = require("./application/useCases/ListFollowers");
const ListFollowing = require("./application/useCases/ListFollowing");
const GetFollowStatus = require("./application/useCases/GetFollowStatus");
const GetFollowCounts = require("./application/useCases/GetFollowCounts");

/* CONTROLLERS */
const UserProfileController = require("./interfaces/http/controllers/UserProfileController");

/* ROUTES */
const createProfileRouter = require("./interfaces/http/routes/profile.routes.js");

/* EVENTS */
const EventBus = require("./infrastructure/messaging/EventBus");
const UserEventsConsumer = require("./infrastructure/messaging/UserEventsConsumer");


const IamClient = require("./infrastructure/iam/IamClient");

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
    const followRepo = new PgFollowRepo({ pool: db });

    /* JWT */
    const jwtVerifier = new JwtVerifier({ secret: process.env.JWT_SECRET });
    const auth = authMiddleware(jwtVerifier);

    /* EVENT BUS (publisher) */
    const eventBus = new EventBus(process.env.RABBITMQ_URL);
    await eventBus.connect();

    /* USE CASES */
    const createUserProfileUC = new CreateUserProfile(profileRepo, prefsRepo, auditRepo);

    const getUserProfileUC = new GetUserProfile(profileRepo, prefsRepo);
    const updateUserProfileUC = new UpdateUserProfile(profileRepo, auditRepo, eventBus);
    const updateUserPreferencesUC = new UpdateUserPreferences(prefsRepo, auditRepo);
    const getDashboardUC = new GetDashboard(profileRepo, dailyRepo);
    const getPublicProfilesBatch = new GetPublicProfilesBatch(profileRepo);

    const followUserUC = new FollowUser(followRepo, profileRepo, auditRepo, eventBus);
    const unfollowUserUC = new UnfollowUser(followRepo, auditRepo, eventBus);

    const listFollowersUC = new ListFollowers(followRepo, profileRepo);
    const listFollowingUC = new ListFollowing(followRepo, profileRepo);

    const getFollowStatusUC = new GetFollowStatus(followRepo);
    const getFollowCountsUC = new GetFollowCounts(followRepo);

    /* EVENT CONSUMER (subscriber) */
    const userEventsConsumer = new UserEventsConsumer(
        process.env.RABBITMQ_URL,
        createUserProfileUC
    );


    const iamClient = new IamClient({ baseUrl: env.IAM_BASE_URL });


    /* CONTROLLER */
    const userProfileController = new UserProfileController({
        getProfile: getUserProfileUC,
        updateProfile: updateUserProfileUC,
        updatePreferences: updateUserPreferencesUC,
        getDashboard: getDashboardUC,
        iamClient,
        getPublicProfilesBatch,
        followUser: followUserUC,
        unfollowUser: unfollowUserUC,
        listFollowers: listFollowersUC,
        listFollowing: listFollowingUC,
        getFollowStatus: getFollowStatusUC,
        getFollowCounts: getFollowCountsUC
    });

    /* ROUTER */
    const profileRouter = createProfileRouter({
        auth,
        audit: (action) => auditMiddleware(auditRepo, action),
        controller: userProfileController
    });

    return {
        routers: { profileRouter },
        consumers: { userEventsConsumer },
        eventBus
    };
}

module.exports = createContainer;
