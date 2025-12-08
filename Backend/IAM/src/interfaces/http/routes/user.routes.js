const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/me", authMiddleware, (req, res) => UserController.me(req, res));

module.exports = router;
