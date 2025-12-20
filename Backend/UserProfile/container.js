const PgClient = require("./infrastructure/db/postgres");

const PgUserProfileRepo = require("./infrastructure/repositories/PgUserProfileRepo");
const PgPreferencesRepo = require("./infrastructure/repositories/PgPreferencesRepo");
const PgUserDSTRepo = require("./infrastructure/repositories/PgUserDSTRepo");
const PgAuditRepo = require("./infrastructure/repositories/PgAuditRepo");

const CreateUserProfile = require("./application/useCases/CreateUserProfile");
const GetUserProfile = require("./application/useCases/GetUserProfile");
const UpdateUserProfile = require("./application/useCases/UpdateUserProfile");
const UpdateUserPreferences = require("./application/useCases/UpdateUserPreferences");
const GetDashboard = require("./application/useCases/GetDashboard");

const UserProfileController = require("./interfaces/http/controllers/UserProfileController");

const UserEventsConsumer = require("./infrastructure/messaging/UserEventsConsumer");

async function createContainer() { 

    const db = new PgClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    });


    const profileRepo = new PgUserProfileRepo({ pool: db });
    const prefsRepo = new PgPreferencesRepo({ pool: db });
    const dailyRepo = new PgUserDSTRepo({ pool: db });
    const auditRepo = new PgAuditRepo({ pool: db });

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

    /*CONTROLLERS*/
    const userProfileController = new UserProfileController({
        getProfile: getUserProfileUC,
        updateProfile: updateUserProfileUC,
        updatePreferences: updateUserPreferencesUC,
        getDashboard: getDashboardUC
    });

    /* EVENT CONSUMER*/
    const userEventsConsumer = new UserEventsConsumer(
        process.env.RABBITMQ_URL,
        createUserProfileUC
    );

    return {
        controllers: {
            userProfileController
        },
        consumers: {
            userEventsConsumer
        }
    };
}

module.exports = createContainer;
