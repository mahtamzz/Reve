/* =========================
    INFRASTRUCTURE
========================= */

// Repositories
const UserRepositoryPg = require("../infrastructure/repositories/UserRepositoryPg");
const AdminRepositoryPg = require("../infrastructure/repositories/AdminRepositoryPg");
const AuditRepositoryPg = require("../infrastructure/repositories/AuditRepositoryPg");

const pool = require("../infrastructure/db/postgres"); // Postgres pool
const withRetry = require("../infrastructure/db/withRetry");
const redis = require("../infrastructure/db/redis");   // single redis import

// Services
const jwtService = require("../infrastructure/auth/JwtService");
const cacheService = require("../infrastructure/cache/CacheService");
const emailService = require("../infrastructure/mail/EmailService");
const eventBus = require("../infrastructure/messaging/EventBus");

// Instantiate repositories
const userRepository = new UserRepositoryPg({
    pool,
    cache: redis,
    withRetry
});

const adminRepository = new AdminRepositoryPg({
    pool,
    cache: redis,
    withRetry
});

const auditRepo = new AuditRepositoryPg({ pool }); // for auditMiddleware

/* =========================
    USE CASES (APPLICATION)
========================= */

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
    CONSTRUCT USE CASES
========================= */

const bcrypt = require("bcrypt");

// User use cases
const register = new RegisterUC({
    userRepo: userRepository,
    cache: redis,
    emailService,
    hasher: { hash: (password) => bcrypt.hash(password, 10) }
});

const verifyOtp = new VerifyOtpUC({
    userRepo: userRepository,  
    cache: redis,              
    tokenService: jwtService, 
    eventBus                  
});

const resendOtp = new ResendOtpUC(
    { cache: redis, emailService } // wrap in object if your UC constructor expects object
);

const userLogin = new UserLoginUC({
    userRepo: userRepository,
    cache: redis,               
    tokenService: jwtService,
    hasher: {
        compare: (plain, hashed) => bcrypt.compare(plain, hashed)
    }
});

const sendLoginOtp = new SendLoginOtpUC({
    userRepo: userRepository,
    cache: redis,
    emailService
});

const verifyLoginOtp = new VerifyLoginOtpUC({
    userRepo: userRepository,
    cache: redis,
    tokenService: jwtService
});


const forgotPassword = new ForgotPasswordUC(
    userRepository,
    redis,
    emailService
);

const resetPassword = new ResetPasswordUC({
    userRepo: userRepository,
    cache: redis,
    tokenService: jwtService,
    hasher: { hash: (password) => bcrypt.hash(password, 10) }
});

const refreshToken = new RefreshTokenUC(jwtService);
const googleAuth = new GoogleAuthUC(userRepository, jwtService);

// Admin use cases
const adminLogin = new AdminLoginUC({
    adminRepo: adminRepository,
    hasher: { compare: (plain, hashed) => bcrypt.compare(plain, hashed) },
    tokenService: jwtService
});

const adminForgotPassword = new AdminForgotPasswordUC({
    adminRepo: adminRepository,
    cache: redis,
    emailService
});

const adminResetPassword = new AdminResetPasswordUC({
    adminRepo: adminRepository,
    cache: redis,
    tokenService: jwtService,
    hasher: { hash: (password) => bcrypt.hash(password, 10) }
});

const getCurrentUser = new GetCurrentUserUC({
    userRepo: userRepository
});

const getCurrentAdmin = new GetCurrentAdminUC({
    adminRepo: adminRepository
});
/* =========================
    EXPORT CONTAINER
========================= */

module.exports = {
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

    // current identity
    getCurrentUser,
    getCurrentAdmin,

    // infrastructure
    userRepository,
    adminRepository,
    auditRepo,
    redis,
    emailService,
    jwtService,
    cacheService,
    eventBus
};
