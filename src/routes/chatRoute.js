const express = require("express");
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const upload = require("../middleware/multer");
const chat = require("../controllers/chatController");

const router = express.Router();

// List user's conversations
router.get("/conversations", auth, chat.listConversations);
// Start a new conversation (or returns existing)
router.post("/conversations", auth, chat.startConversation);
// Get messages in a conversation (cursor based)
router.get("/conversations/:conversationId/messages", auth, chat.getMessages);
// Send message with optional media (<= env limit enforced by multer config)
router.post("/messages", auth, upload.single("media"), chat.sendMessage);
// Mark conversation read
router.post("/conversations/read", auth, chat.markRead);

module.exports = router;
