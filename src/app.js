require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { initializeSocket } = require("./socket");
const errorMiddleware = require("./middleware/errorMiddleware");
const auth = require("./routes/authRoute");
const profile = require("./routes/profileRoute");
const posts = require("./routes/postRoute");
const postInteractions = require("./routes/postInteractionRoutes");
const comments = require("./routes/commentRoutes");
const setupSwagger = require("../swagger");
require("./config/db");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available to routes/controllers
app.set("io", io);

// CORS Configuration - Allow frontend admin panel
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001", 
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log("Incoming Request:", {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  });
  next(); // Pass control to the next middleware
});

// Serve static files (keep for backwards compatibility with existing local files)
// Note: New uploads will be stored in S3 and served directly from S3 URLs
app.use("/api/images", express.static(path.join(__dirname, "../images")));

// Serve assets folder (logo, etc.)
app.use("/assets", express.static(path.join(__dirname, "../assets")));

// Routes
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/posts", posts);
app.use("/api/posts", postInteractions);
app.use("/api/comments", comments);
app.use("/api/pets", require("./routes/petRoute"));
app.use("/api/follow", require("./routes/followRoute"));
app.use("/api/coins", require("./routes/coinRoute"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/share", require("./routes/shareRoute")); // Share routes with Open Graph meta tags

// Admin Routes
app.use("/api/admin", require("./admin/routes/adminRoutes"));

app.get("/", (req, res) => {
  res.send("Welcome to the petoye backend API");
});

setupSwagger(app);

//Error Handling
app.use(errorMiddleware);

server.listen(process.env.PORT, () => {
  console.log("🚀 Server listening on port " + process.env.PORT);
  console.log("📱 Socket.IO ready for real-time communication");
});
