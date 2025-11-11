const express = require("express");
const router = express.Router();
const { adminAuth } = require("../middleware/adminAuthMiddleware");

// Import controllers
const adminAuthController = require("../controllers/adminAuthController");
const adminUserController = require("../controllers/adminUserController");
const adminPostController = require("../controllers/adminPostController");
const adminPetController = require("../controllers/adminPetController");
const adminAnalyticsController = require("../controllers/adminAnalyticsController");
const adminContentController = require("../controllers/adminContentController");

// Import sub-admin routes
const subAdminRoutes = require("./subAdminRoutes");

// ==================== AUTH ROUTES ====================
// Public routes (no auth required)
router.post("/auth/login", adminAuthController.login);
router.post("/auth/refresh-token", adminAuthController.refreshToken);

// Protected routes (auth required)
router.post("/auth/logout", adminAuth, adminAuthController.logout);
router.get("/auth/profile", adminAuth, adminAuthController.getProfile);
router.put("/auth/profile", adminAuth, adminAuthController.updateProfile);
router.put("/auth/change-password", adminAuth, adminAuthController.changePassword);

// ==================== SUB-ADMIN MANAGEMENT ROUTES ====================
router.use("/sub-admins", subAdminRoutes);

// ==================== USER MANAGEMENT ROUTES ====================
router.get("/users", adminAuth, adminUserController.getAllUsers);
router.get("/users/stats", adminAuth, adminUserController.getUserStats);
router.get("/users/search", adminAuth, adminUserController.searchUsers);
router.get("/users/:userId", adminAuth, adminUserController.getUserById);
router.put("/users/:userId", adminAuth, adminUserController.updateUser);
router.delete("/users/:userId", adminAuth, adminUserController.deleteUser);
router.put("/users/:userId/verify-email", adminAuth, adminUserController.verifyUserEmail);
router.put("/users/:userId/tokens", adminAuth, adminUserController.updateUserTokens);
router.get("/users/:userId/activity", adminAuth, adminUserController.getUserActivity);

// ==================== POST MANAGEMENT ROUTES ====================
router.get("/posts", adminAuth, adminPostController.getAllPosts);
router.get("/posts/stats", adminAuth, adminPostController.getPostStats);
router.get("/posts/search", adminAuth, adminPostController.searchPosts);
router.get("/posts/:postId", adminAuth, adminPostController.getPostById);
router.put("/posts/:postId", adminAuth, adminPostController.updatePost);
router.delete("/posts/:postId", adminAuth, adminPostController.deletePost);
router.post("/posts/delete-multiple", adminAuth, adminPostController.deleteMultiplePosts);
router.get("/posts/user/:userId", adminAuth, adminPostController.getPostsByUser);

// ==================== PET LISTING MANAGEMENT ROUTES ====================
router.get("/pets", adminAuth, adminPetController.getAllPetListings);
router.get("/pets/stats", adminAuth, adminPetController.getPetListingStats);
router.get("/pets/search", adminAuth, adminPetController.searchPetListings);
router.get("/pets/:petId", adminAuth, adminPetController.getPetListingById);
router.put("/pets/:petId", adminAuth, adminPetController.updatePetListing);
router.delete("/pets/:petId", adminAuth, adminPetController.deletePetListing);
router.put("/pets/:petId/status", adminAuth, adminPetController.updatePetListingStatus);
router.post("/pets/delete-multiple", adminAuth, adminPetController.deleteMultiplePetListings);
router.get("/pets/owner/:ownerId", adminAuth, adminPetController.getPetListingsByOwner);

// ==================== ANALYTICS ROUTES ====================
router.get("/analytics/dashboard", adminAuth, adminAnalyticsController.getDashboardStats);
router.get("/analytics/user-growth", adminAuth, adminAnalyticsController.getUserGrowthAnalytics);
router.get("/analytics/post-activity", adminAuth, adminAnalyticsController.getPostActivityAnalytics);
router.get("/analytics/top-users", adminAuth, adminAnalyticsController.getTopUsers);
router.get("/analytics/engagement", adminAuth, adminAnalyticsController.getEngagementMetrics);
router.get("/analytics/token-economy", adminAuth, adminAnalyticsController.getTokenEconomyAnalytics);
router.get("/analytics/content-moderation", adminAuth, adminAnalyticsController.getContentModerationStats);

// ==================== COMMENT MANAGEMENT ROUTES ====================
router.get("/comments", adminAuth, adminContentController.getAllComments);
router.delete("/comments/:commentId", adminAuth, adminContentController.deleteComment);
router.post("/comments/delete-multiple", adminAuth, adminContentController.deleteMultipleComments);

// ==================== NOTIFICATION MANAGEMENT ROUTES ====================
router.get("/notifications", adminAuth, adminContentController.getAllNotifications);
router.delete("/notifications/:notificationId", adminAuth, adminContentController.deleteNotification);

// ==================== CHAT/MESSAGE MANAGEMENT ROUTES ====================
router.get("/conversations", adminAuth, adminContentController.getAllConversations);
router.get("/conversations/:conversationId/messages", adminAuth, adminContentController.getConversationMessages);
router.delete("/conversations/:conversationId", adminAuth, adminContentController.deleteConversation);
router.delete("/messages/:messageId", adminAuth, adminContentController.deleteMessage);

// ==================== FOLLOW MANAGEMENT ROUTES ====================
router.get("/follows", adminAuth, adminContentController.getAllFollows);
router.delete("/follows/:followId", adminAuth, adminContentController.deleteFollow);

// ==================== LIKE MANAGEMENT ROUTES ====================
router.get("/likes", adminAuth, adminContentController.getAllLikes);
router.delete("/likes/:likeId", adminAuth, adminContentController.deleteLike);

module.exports = router;
