require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorMiddleware = require("./middleware/errorMiddleware");
const http = require("http");
const { initSocket } = require("./socket/index");
const auth = require("./routes/authRoute");
const profile = require("./routes/profileRoute");
const posts = require("./routes/postRoute");
const postInteractions = require("./routes/postInteractionRoutes");
const comments = require("./routes/commentRoutes");
const setupSwagger = require("../swagger");
require("./config/db");

const app = express();
app.use(
  cors({
    origin: ["*", process.env.CLIENT_URL],
    credentials: true,
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

// Serve static files
app.use("/api/images", express.static(path.join(__dirname, "../images")));

// Routes
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/posts", posts);
app.use("/api/posts", postInteractions);
app.use("/api/comments", comments);
app.use("/api/notifications", require("./routes/notificationRoute"));
app.use("/api/pets", require("./routes/petRoute"));
app.use("/api/follow", require("./routes/followRoute"));
app.use("/api/chat", require("./routes/chatRoute"));

app.get("/", (req, res) => {
  res.send("Welcome to the petoye backend API");
});

setupSwagger(app);

//Error Handling
app.use(errorMiddleware);

const server = http.createServer(app);
initSocket(server);
server.listen(process.env.PORT, () => {
  console.log("Listening at port number " + process.env.PORT);
});
