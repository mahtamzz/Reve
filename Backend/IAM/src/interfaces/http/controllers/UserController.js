const GetCurrentUser = require("../../../application/useCases/users/GetCurrentUser");

class UserController {
    async me(req, res) {
        try {
            const user = await GetCurrentUser.execute(req.user.user_id);
            res.json(user);
        } catch (err) {
            res.status(404).json({ message: err.message });
        }
    }
}

module.exports = new UserController();
