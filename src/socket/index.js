const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const SessionToken = require("../models/sessionToken.model");

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
