const express = require("express");
const router = express.Router();
const adminSubAdminController = require("../controllers/adminSubAdminController");
const { adminAuth } = require("../middleware/adminAuthMiddleware");

// Apply admin authentication to all routes
router.use(adminAuth);

// Get all sub-admins
router.get("/", adminSubAdminController.getAllSubAdmins);

// Get admin statistics
router.get("/stats", adminSubAdminController.getAdminStats);

// Get single sub-admin
router.get("/:adminId", adminSubAdminController.getSubAdminById);

// Create new sub-admin
router.post("/", adminSubAdminController.createSubAdmin);

// Update sub-admin
router.put("/:adminId", adminSubAdminController.updateSubAdmin);

// Update sub-admin permissions
router.patch("/:adminId/permissions", adminSubAdminController.updateSubAdminPermissions);

// Reset sub-admin password
router.patch("/:adminId/reset-password", adminSubAdminController.resetSubAdminPassword);

// Delete sub-admin
router.delete("/:adminId", adminSubAdminController.deleteSubAdmin);

module.exports = router;