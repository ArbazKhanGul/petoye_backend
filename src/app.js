require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");



const setupSwagger = require("../swagger");
require("./config/db");

const app = express();

// Create HTTP server
const server = http.createServer(app);




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



// Admin Routes
app.use("/api/admin", require("./admin/routes/adminRoutes"));

app.get("/", (req, res) => {
  res.send("Welcome to the petoye backend API");
});

setupSwagger(app);



server.listen(process.env.PORT, () => {
  console.log("🚀 Server listening on port " + process.env.PORT);
 
});
