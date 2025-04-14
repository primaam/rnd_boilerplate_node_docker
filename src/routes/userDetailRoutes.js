const express = require("express");
const router = express.Router();
const userDetailController = require("../controllers/userDetailController");
const { verifyToken, verifyUser, isAdmin } = require("../middlewares/authMiddleware");

// Get current user detail
router.get("/me", verifyToken, verifyUser, userDetailController.getUserDetail);

// Get user detail by id
router.get("/:id", verifyToken, verifyUser, userDetailController.getUserDetail);

// Update user detail
router.put("/:id", verifyToken, verifyUser, userDetailController.updateUserDetail);

// Get all user details (admin only)
router.get("/", verifyToken, verifyUser, isAdmin, userDetailController.getAllUserDetails);

// Delete user detail (admin only)
router.delete("/:id", verifyToken, verifyUser, isAdmin, userDetailController.deleteUserDetail);

module.exports = router;
