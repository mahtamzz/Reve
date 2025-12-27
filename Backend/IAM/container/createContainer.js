const bcrypt = require("bcrypt");

const PostgresClient = require("../infrastructure/db/postgres");
const withRetry = require("../infrastructure/db/withRetry");

const RedisClient = require("../infrastructure/db/redis");
const CacheService = require("../infrastructure/cache/CacheService");

const EmailService = require("../infrastructure/mail/EmailService");
const JwtService = require("../infrastructure/auth/JwtService");
const RefreshTokenStore = require("../infrastructure/auth/RefreshTokenStore");
const EventBus = require("../infrastructure/messaging/EventBus");

const UserRepositoryPg = require("../infrastructure/repositories/UserRepositoryPg");
const AdminRepositoryPg = require("../infrastructure/repositories/AdminRepositoryPg");
const AuditRepositoryPg = require("../infrastructure/repositories/AuditRepositoryPg");

/* USE CASES */
const RegisterUC = require("../application/useCases/auth/Register");
const VerifyOtpUC = require("../application/useCases/auth/VerifyOtp");
const ResendOtpUC = require("../application/useCases/auth/ResendOtp");
const UserLoginUC = require("../application/useCases/auth/UserLogin");
const SendLoginOtpUC = require("../application/useCases/auth/SendLoginOtp");
const VerifyLoginOtpUC = require("../application/useCases/auth/VerifyLoginOtp");
const ForgotPasswordUC = require("../application/useCases/auth/ForgotPassword");
const ResetPasswordUC = require("../application/useCases/auth/ResetPassword");
const RefreshTokenUC = require("../application/useCases/auth/RefreshToken");
const GoogleAuthUC = require("../application/useCases/auth/GoogleAuth");

const AdminLoginUC = require("../application/useCases/auth/AdminLogin");
const AdminForgotPasswordUC = require("../application/useCases/auth/AdminForgotPassword");
const AdminResetPasswordUC = require("../application/useCases/auth/AdminResetPassword");

const GetCurrentUserUC = require("../application/useCases/users/GetCurrentUser");
const GetCurrentAdminUC = require("../application/useCases/users/GetCurrentAdmin");

/* =========================
    ASYNC INITIALIZATION
========================= */

async function createContainer() {
    const db = new PostgresClient({
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE
    });

    const redisClient = new RedisClient({ host: process.env.REDIS_HOST });
    await redisClient.connect();
    console.log("Redis connected?", redisClient.getClient().isOpen);

    const cacheService = new CacheService(redisClient.getClient());

    const emailService = new EmailService({
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    });

    await emailService.transporter.verify();
    console.log("📧 Email service ready");


    const jwtService = new JwtService(process.env.JWT_SECRET);

    const refreshTokenStore = new RefreshTokenStore(cacheService);

    const eventBus = new EventBus(process.env.RABBITMQ_URL);
    await eventBus.connect();

    /* REPOSITORIES */
    const userRepository = new UserRepositoryPg({
        pool: db,
        cache: cacheService,
        withRetry
    });

    const adminRepository = new AdminRepositoryPg({
        pool: db,
        cache: cacheService,
        withRetry
    });

    const auditRepo = new AuditRepositoryPg({ pool: db });

    /* USE CASES */
    const register = new RegisterUC({
        userRepo: userRepository,
        cache: cacheService,
        emailService,
        hasher: { hash: (password) => bcrypt.hash(password, 10) }
    });

    const verifyOtp = new VerifyOtpUC({
        userRepo: userRepository,
        cache: cacheService,
        tokenService: jwtService,
        eventBus, 
        refreshTokenStore
    });

    const resendOtp = new ResendOtpUC({
        cache: cacheService,
        emailService
    });

    const userLogin = new UserLoginUC({
        userRepo: userRepository,
        cache: cacheService,
        tokenService: jwtService,
        hasher: { compare: (plain, hashed) => bcrypt.compare(plain, hashed) }, 
        refreshTokenStore
    });

    const sendLoginOtp = new SendLoginOtpUC({
        userRepo: userRepository,
        cache: cacheService,
        emailService
    });

    const verifyLoginOtp = new VerifyLoginOtpUC({
        userRepo: userRepository,
        cache: cacheService,
        tokenService: jwtService,
        refreshTokenStore
    });

    const forgotPassword = new ForgotPasswordUC({
        userRepo: userRepository,
        cache: cacheService,
        emailService
    });

    const resetPassword = new ResetPasswordUC({
        userRepo: userRepository,
        cache: cacheService,
        tokenService: jwtService,
        hasher: { hash: (password) => bcrypt.hash(password, 10) },
        refreshTokenStore
    });

    const refreshToken = new RefreshTokenUC(jwtService, userRepository, refreshTokenStore);
    const googleAuth = new GoogleAuthUC(userRepository, jwtService, refreshTokenStore);

    const adminLogin = new AdminLoginUC({
        adminRepo: adminRepository,
        hasher: { compare: (plain, hashed) => bcrypt.compare(plain, hashed) },
        tokenService: jwtService
    });

    const adminForgotPassword = new AdminForgotPasswordUC({
        adminRepo: adminRepository,
        cache: cacheService,
        emailService
    });

    const adminResetPassword = new AdminResetPasswordUC({
        adminRepo: adminRepository,
        cache: cacheService,
        tokenService: jwtService,
        hasher: { hash: (password) => bcrypt.hash(password, 10) }
    });

    const getCurrentUser = new GetCurrentUserUC({ userRepo: userRepository });
    const getCurrentAdmin = new GetCurrentAdminUC({ adminRepo: adminRepository });

    /* EXPORT CONTAINER */
    return {
        // user
        register,
        verifyOtp,
        resendOtp,
        userLogin,
        sendLoginOtp,
        verifyLoginOtp,
        forgotPassword,
        resetPassword,
        refreshToken,
        googleAuth,

        // admin
        adminLogin,
        adminForgotPassword,
        adminResetPassword,

        // identity
        getCurrentUser,
        getCurrentAdmin,

        // infrastructure
        userRepository,
        adminRepository,
        auditRepo,
        redisClient,
        cacheService,
        emailService,
        jwtService,
        refreshTokenStore,
        eventBus
    };
}

module.exports = createContainer;
