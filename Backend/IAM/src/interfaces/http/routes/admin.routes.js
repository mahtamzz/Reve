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
 *     tags: [Admins]
 *     description: Returns the profile of the logged-in admin. Uses token cookie for authentication.
 *     security:
 *       - cookieAuth: []      # <-- note: updated from bearerAuth
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 */

module.exports = router;