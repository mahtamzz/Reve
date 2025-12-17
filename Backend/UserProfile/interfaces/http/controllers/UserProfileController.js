class UserProfileController {
    constructor({
        getProfile,
        updateProfile,
        updatePreferences,
        getDashboard
    }) {
        this.getProfile = getProfile;
        this.updateProfile = updateProfile;
        this.updatePreferences = updatePreferences;
        this.getDashboard = getDashboard;
    }

    getMe = async (req, res) => {
        const uid = req.user.uid;
        const data = await this.getProfile.execute(uid);
        res.json(data);
    };

    updateProfileInfo = async (req, res) => {
        const uid = req.user.uid;
        await this.updateProfile.execute(uid, req.body);
        res.status(204).end();
    };

    updatePreferencesInfo = async (req, res) => {
        const uid = req.user.uid;
        await this.updatePreferences.execute(uid, req.body);
        res.status(204).end();
    };

    dashboard = async (req, res) => {
        const uid = req.user.uid;
        const data = await this.getDashboard.execute(uid);
        res.json(data);
    };
}

module.exports = UserProfileController;
