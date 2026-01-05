require("dotenv").config();

const path = require("path");
const PgClient = require("./infrastructure/db/postgres");

/* SHARED */
const JwtVerifier = require("../shared/auth/JwtVerifier");
const authMiddleware = require("../shared/auth/authMiddleware");
const requireUser = require("../shared/auth/requireUser");
const requireAdmin = require("../shared/auth/requireAdmin");

/* REPOS */
const PgAvatarRepo = require("./infrastructure/repositories/PgAvatarRepo");

/* STORAGE */
const LocalAvatarStorage = require("./infrastructure/storage/LocalAvatarStorage");

/* USE CASES */
const UploadAvatar = require("./application/useCases/UploadAvatar");
const GetAvatarMeta = require("./application/useCases/GetAvatarMeta");
const DeleteAvatar = require("./application/useCases/DeleteAvatar");

/* CONTROLLER + ROUTES */
const MediaController = require("./interfaces/http/controllers/MediaController");
const createMediaRoutes = require("./interfaces/http/routes/media.routes");

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
    const avatarRepo = new PgAvatarRepo(db);

    /* STORAGE (filesystem) */
    const uploadsBaseDir =
        process.env.UPLOADS_DIR ||
        path.join(__dirname, "uploads"); // Media/uploads inside container working dir

    const storage = new LocalAvatarStorage({
        baseDir: uploadsBaseDir,
        avatarDirName: "avatars"
    });

    /* JWT */
    const jwtVerifier = new JwtVerifier({
        secret: process.env.JWT_SECRET
    });
    const auth = authMiddleware(jwtVerifier);

    /* USE CASES */
    const uploadAvatar = new UploadAvatar({
        avatarRepo,
        storage,
        maxBytes: Number(process.env.AVATAR_MAX_BYTES || 2 * 1024 * 1024)
    });

    const getAvatarMeta = new GetAvatarMeta(avatarRepo);

    const deleteAvatar = new DeleteAvatar({
        avatarRepo,
        storage
    });

    /* CONTROLLER */
    const controller = new MediaController({
        uploadAvatar,
        getAvatarMeta,
        deleteAvatar,
        storage
    });

    /* ROUTER */
    const mediaRouter = createMediaRoutes({
        controller,
        auth,
        requireUser, 
        requireAdmin
    });

    return {
        routers: {
            mediaRouter
        }
    };
}

module.exports = createContainer;
