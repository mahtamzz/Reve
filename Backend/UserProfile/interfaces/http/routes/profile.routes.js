const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UserProfileController = require('../controllers/UserProfileController');
const profileRepo = require('../../../infrastructure/repositories/PgUserProfileRepo');
const prefsRepo = require('../../../infrastructure/repositories/PgPreferencesRepo');
const dailyRepo = require('../../../infrastructure/repositories/PgUserDSTRepo');
const auditRepo = require('../../../infrastructure/repositories/PgAuditRepo');

const GetUserProfile = require('../../../application/useCases/GetUserProfile');
const UpdateUserProfile = require('../../../application/useCases/UpdateUserProfile');
const UpdateUserPreferences = require('../../../application/useCases/UpdateUserPreferences');
const GetDashboard = require('../../../application/useCases/GetDashboard');

const controller = new UserProfileController({
    getProfile: new GetUserProfile(profileRepo, prefsRepo),
    updateProfile: new UpdateUserProfile(profileRepo, auditRepo),
    updatePreferences: new UpdateUserPreferences(prefsRepo, auditRepo),
    getDashboard: new GetDashboard(profileRepo, dailyRepo)
});

const router = express.Router();

router.get('/me', authMiddleware, controller.getMe);
router.get('/dashboard', authMiddleware, controller.dashboard);
router.patch('/me', authMiddleware, controller.updateProfileInfo);
router.patch('/preferences', authMiddleware, controller.updatePreferencesInfo);

module.exports = router;
