const { Server } = require("socket.io");
const socketAuthMiddleware = require("./authMiddleware");
const { handleConnection } = require("./eventHandlers");
const connectionManager = require("./connectionManager");
const NotificationService = require("./notificationService");

/**
 * Initialize Socket.IO server
 * @param {object} httpServer - HTTP server instance
 * @returns {object} Socket.IO server instance
 */
function initializeSocket(httpServer) {
  // Create Socket.IO server with CORS configuration
  const io = new Server(httpServer, {
    cors: {
      origin: ["*", process.env.CLIENT_URL],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Connection timeout
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  // Initialize notification service
  const notificationService = new NotificationService(io);

  // Handle connections
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  // Store notification service in io for access from other modules
  io.notificationService = notificationService;

  console.log("🚀 Socket.IO server initialized successfully");

  return io;
}

/**
 * Get connection manager for external use
 */
function getConnectionManager() {
  return connectionManager;
}

/**
 * Helper function to send notification from other parts of the app
 * @param {object} io - Socket.IO server instance
 * @param {string} userId - Target user ID
 * @param {object} notification - Notification data
 */
function sendNotification(io, userId, notification) {
  if (io.notificationService) {
    return io.notificationService.sendNotification(userId, notification);
  }
  console.error("Notification service not initialized");
  return Promise.resolve({ success: false, error: "Service not available" });
}

module.exports = {
  initializeSocket,
  getConnectionManager,
  sendNotification,
};
