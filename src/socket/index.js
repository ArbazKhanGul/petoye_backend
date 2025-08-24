const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const SessionToken = require("../models/sessionToken.model");
// Chat models & services (lazy loaded portions of chatController logic for socket-based send)
const { Conversation, Message } = require("../models");
const { sendPushToUser } = require("../services/pushService");

let ioInstance = null;
// Track online users with connection counts
const onlineUsers = new Map(); // userId -> connection count

async function authenticateSocket(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers["authorization"]?.split(" ")[1];
    if (!token) return next(new Error("Unauthorized"));
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY_JSON_WEB_TOKEN_LOGIN);
    } catch (e) {
      return next(new Error("Invalid token"));
    }
    const session = await SessionToken.findOne({
      userId: decoded._id,
      authToken: token,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });
    if (!session) return next(new Error("Invalid session"));
    socket.user = { _id: decoded._id, role: decoded.role };
    return next();
  } catch (err) {
    return next(new Error("Auth error"));
  }
}

function initSocket(server) {
  if (ioInstance) return ioInstance;
  const io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL, "*"],
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.user?._id?.toString();
    if (userId) {
      socket.join(`user:${userId}`);
      const current = onlineUsers.get(userId) || 0;
      onlineUsers.set(userId, current + 1);
      // Optional: emit presence change to the user (or their contacts)
      io.to(`user:${userId}`).emit("presence:update", { userId, online: true });
    }

    // Realtime text message sending (socket -> server) without HTTP round trip.
    // Payload: { conversationId, text }
    socket.on("chat:send", async (payload, cb) => {
      console.log("🚀 ~ initSocket ~ payload:", payload);
      try {
        if (!payload || typeof payload !== "object") {
          return cb && cb({ ok: false, error: "Invalid payload" });
        }
        const { conversationId, text } = payload;
        if (!conversationId || !text || !text.trim()) {
          return (
            cb && cb({ ok: false, error: "conversationId and text required" })
          );
        }
        const conv = await Conversation.findById(conversationId);
        if (!conv)
          return cb && cb({ ok: false, error: "Conversation not found" });
        const uid = socket.user?._id?.toString();
        if (!uid || !conv.participants.some((p) => p.user.toString() === uid)) {
          return cb && cb({ ok: false, error: "Not a participant" });
        }
        // Identify recipient
        const recipient = conv.participants
          .map((p) => p.user.toString())
          .find((id) => id !== uid);
        if (!recipient)
          return cb && cb({ ok: false, error: "Recipient missing" });

        const msgPayload = {
          conversation: conversationId,
          sender: uid,
          recipient,
          type: "text",
          text: text.trim(),
        };
        const msg = await Message.create(msgPayload);

        // Update conversation lastMessage + unread count for recipient
        conv.lastMessage = {
          text: msgPayload.text,
          type: "text",
          at: new Date(),
          sender: uid,
        };
        if (!(conv.unreadCounts instanceof Map)) {
          const m = new Map();
          if (conv.unreadCounts && typeof conv.unreadCounts === "object") {
            for (const [k, v] of Object.entries(conv.unreadCounts)) m.set(k, v);
          }
          conv.unreadCounts = m;
        }
        const currentUnread = Number(conv.unreadCounts.get(recipient) || 0);
        conv.unreadCounts.set(recipient, currentUnread + 1);
        await conv.save();

        // Emit to both participants (mirrors HTTP controller behavior)
        emitToUser(recipient, "chat:new", { conversationId, message: msg });
        emitToUser(uid, "chat:new", { conversationId, message: msg });

        // Push only if recipient offline
        if (!isUserOnline(recipient)) {
          try {
            sendPushToUser(
              recipient,
              "New message",
              msgPayload.text || "Sent a message",
              { type: "chat", conversationId }
            );
          } catch {}
        }

        cb && cb({ ok: true, message: msg });
      } catch (err) {
        cb && cb({ ok: false, error: "Failed to send" });
      }
    });

    socket.on("disconnect", () => {
      const uid = socket.user?._id?.toString();
      if (!uid) return;
      const current = onlineUsers.get(uid) || 0;
      if (current <= 1) {
        onlineUsers.delete(uid);
        io.to(`user:${uid}`).emit("presence:update", {
          userId: uid,
          online: false,
        });
      } else {
        onlineUsers.set(uid, current - 1);
      }
    });
  });

  ioInstance = io;
  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

function isUserOnline(userId) {
  return onlineUsers.has(userId.toString());
}

module.exports = { initSocket, getIO, emitToUser, isUserOnline };
