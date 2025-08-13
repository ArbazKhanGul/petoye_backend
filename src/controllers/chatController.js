const AppError = require("../errors/appError");
const { Conversation, Message, User } = require("../models");
const path = require("path");

function buildConversationKey(a, b) {
  return [a.toString(), b.toString()].sort().join(":");
}

exports.listConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const convos = await Conversation.find({ "participants.user": userId })
      .sort({ updatedAt: -1 })
      .populate("participants.user", "fullName profileImage")
      .lean();

    // compute unread for this user
    const items = convos.map((c) => ({
      _id: c._id,
      participants: c.participants,
      lastMessage: c.lastMessage,
      unread: Number(c.unreadCounts?.get(userId.toString()) || 0),
      updatedAt: c.updatedAt,
    }));

    res.json({ items });
  } catch (e) {
    next(new AppError("Failed to load conversations", 500));
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { cursor, limit = 30 } = req.query;

    const convo = await Conversation.findById(conversationId);
    if (
      !convo ||
      !convo.participants.some((p) => p.user.toString() === userId.toString())
    ) {
      return next(new AppError("Conversation not found", 404));
    }

    const query = { conversation: conversationId };
    if (cursor) query._id = { $lt: cursor };
    const items = await Message.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .populate("sender", "fullName profileImage")
      .lean();

    const nextCursor = items.length ? items[items.length - 1]._id : null;

    res.json({ items: items.reverse(), nextCursor });
  } catch (e) {
    next(new AppError("Failed to load messages", 500));
  }
};

exports.startConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { to } = req.body;
    if (!to) return next(new AppError("Recipient is required", 400));
    if (to.toString() === userId.toString())
      return next(new AppError("Cannot start conversation with yourself", 400));

    let convo = await Conversation.findOne({
      participants: {
        $all: [{ $elemMatch: { user: userId } }, { $elemMatch: { user: to } }],
      },
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [{ user: userId }, { user: to }],
        unreadCounts: { [to.toString()]: 0, [userId.toString()]: 0 },
      });
    }

    res.status(201).json({ conversationId: convo._id });
  } catch (e) {
    next(new AppError("Failed to start conversation", 500));
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId, text, type } = req.body;

    const convo = await Conversation.findById(conversationId);
    if (
      !convo ||
      !convo.participants.some((p) => p.user.toString() === userId.toString())
    ) {
      return next(new AppError("Conversation not found", 404));
    }

    const other = convo.participants
      .map((p) => p.user.toString())
      .find((id) => id !== userId.toString());
    if (!other) return next(new AppError("Recipient missing", 400));

    const payload = {
      conversation: conversationId,
      sender: userId,
      recipient: other,
      type:
        type ||
        (req.file
          ? req.file.mimetype.startsWith("image/")
            ? "image"
            : req.file.mimetype.startsWith("video/")
            ? "video"
            : "document"
          : "text"),
      text: text || "",
      media: req.file
        ? {
            url: req.file.path
              .replace(/\\/g, "/")
              .replace(/^.*images\//, "/images/"),
            type: req.file.mimetype.startsWith("image/")
              ? "image"
              : req.file.mimetype.startsWith("video/")
              ? "video"
              : "document",
            size: req.file.size,
            mimeType: req.file.mimetype,
          }
        : undefined,
    };

    const msg = await Message.create(payload);

    convo.lastMessage = {
      text: payload.type === "text" ? payload.text : payload.type,
      type: payload.type,
      at: new Date(),
      sender: userId,
    };
    // increment unread for recipient
    const current = Number(convo.unreadCounts.get(other) || 0);
    convo.unreadCounts.set(other, current + 1);
    await convo.save();

    res.status(201).json({ message: msg });

    // Realtime emit and push
    try {
      const { emitToUser } = require("../socket");
      const { sendPushToUser } = require("../services/pushService");
      emitToUser(other, "chat:new", {
        conversationId: convo._id,
        message: msg,
      });
      sendPushToUser(
        other,
        "New message",
        payload.type === "text" ? payload.text : "Sent a media",
        {
          type: "chat",
          conversationId: convo._id,
        }
      );
    } catch {}
  } catch (e) {
    next(new AppError("Failed to send message", 500));
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.body;
    const convo = await Conversation.findById(conversationId);
    if (
      !convo ||
      !convo.participants.some((p) => p.user.toString() === userId.toString())
    ) {
      return next(new AppError("Conversation not found", 404));
    }
    await Message.updateMany(
      { conversation: conversationId, recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );
    convo.unreadCounts.set(userId.toString(), 0);
    await convo.save();
    res.json({ ok: true });
  } catch (e) {
    next(new AppError("Failed to mark read", 500));
  }
};
