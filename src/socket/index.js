const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const SessionToken = require("../models/sessionToken.model");

let ioInstance = null;

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
    }

    socket.on("disconnect", () => {
      // cleanup if needed
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

module.exports = { initSocket, getIO, emitToUser };
