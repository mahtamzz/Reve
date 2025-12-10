const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

router.get("/me", adminAuthMiddleware, (req, res) => AdminController.me(req, res));

/**
 * @swagger
 * /api/admins/me:
 *   get:
 *     summary: Get current logged-in admin info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current admin retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *       404:
 *         description: Admin not found
 */

module.exports = router;
