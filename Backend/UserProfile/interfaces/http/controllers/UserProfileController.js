class UserProfileController {
    constructor({
        getProfile,
        updateProfile,
        updatePreferences,
        getDashboard,
        iamClient
    }) {
        this.getProfile = getProfile;
        this.updateProfile = updateProfile;
        this.updatePreferences = updatePreferences;
        this.getDashboard = getDashboard;
        this.iamClient = iamClient;
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

    changePassword = async (req, res) => {
        const authHeader = req.headers.authorization || "";
        const uid = req.user.uid; // not required if IAM uses token, but ok to have

        await this.iamClient.changePassword(authHeader, {
            current_password: req.body.current_password,
            new_password: req.body.new_password
        });
        res.status(204).end();
    };
}

module.exports = UserProfileController;
