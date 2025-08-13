const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.post("/:id/read", notificationController.markRead);
router.post("/read-all", notificationController.markAllRead);

module.exports = router;
