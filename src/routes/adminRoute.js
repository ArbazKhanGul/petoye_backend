const express = require("express");
const adminController = require("../controllers/adminController");
const { adminAuthMiddleware, checkPermission, checkRole } = require("../middleware/adminAuthMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 */

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminLogin'
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/auth/login", adminController.adminLogin);

/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logout successful
 */
router.post("/auth/logout", adminAuthMiddleware, adminController.adminLogout);

/**
 * @swagger
 * /api/admin/auth/refresh-token:
 *   post:
 *     summary: Refresh admin token
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post("/auth/refresh-token", adminController.refreshAdminToken);

// All routes below require admin authentication
router.use(adminAuthMiddleware);

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
 */
router.get("/dashboard/stats", checkPermission("analytics_view"), adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [verified, unverified]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get("/users", checkPermission("user_management"), adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *       404:
 *         description: User not found
 */
router.get("/users/:id", checkPermission("user_management"), adminController.getUserById);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               emailVerify:
 *                 type: boolean
 *               tokens:
 *                 type: number
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put("/users/:id", checkPermission("user_management"), adminController.updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user and related data
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", checkRole(["super_admin", "admin"]), adminController.deleteUser);

/**
 * @swagger
 * /api/admin/posts:
 *   get:
 *     summary: Get all posts with pagination and filters
 *     tags: [Admin Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *     responses:
 *       200:
 *         description: Posts fetched successfully
 */
router.get("/posts", checkPermission("post_management"), adminController.getAllPosts);

/**
 * @swagger
 * /api/admin/posts/{id}:
 *   delete:
 *     summary: Delete post and related data
 *     tags: [Admin Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete("/posts/:id", checkPermission("post_management"), adminController.deletePost);

/**
 * @swagger
 * /api/admin/tokens/transactions:
 *   get:
 *     summary: Get token transactions
 *     tags: [Admin Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [like, referral]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token transactions fetched successfully
 */
router.get("/tokens/transactions", checkPermission("token_management"), adminController.getTokenTransactions);

/**
 * @swagger
 * /api/admin/tokens/adjust:
 *   post:
 *     summary: Adjust user tokens
 *     tags: [Admin Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *               - reason
 *             properties:
 *               userId:
 *                 type: string
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User tokens adjusted successfully
 *       404:
 *         description: User not found
 */
router.post("/tokens/adjust", checkPermission("token_management"), adminController.adjustUserTokens);

/**
 * @swagger
 * /api/admin/export/users:
 *   get:
 *     summary: Export users data
 *     tags: [Admin Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *     responses:
 *       200:
 *         description: Users data exported successfully
 */
router.get("/export/users", checkRole(["super_admin", "admin"]), adminController.exportUsers);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit logs fetched successfully
 */
router.get("/audit-logs", checkRole(["super_admin", "admin"]), adminController.getAuditLogs);

module.exports = router;
