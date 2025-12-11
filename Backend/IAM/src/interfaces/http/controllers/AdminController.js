const GetCurrentAdmin = require("../../../application/useCases/users/GetCurrentAdmin");

class AdminController {
    async me(req, res) {
        try {
            const admin = await GetCurrentAdmin.execute(req.admin.admin_id); // assuming authMiddleware sets req.admin
            res.json(admin);
        } catch (err) {
            res.status(404).json({ message: err.message });
        }
    }
}

module.exports = new AdminController();
