require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middleware/errorMiddleware");
const auth = require("../src/routes/authRoute");
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

// Routes
app.use("/api/auth", auth);
app.get("/", (req, res) => {
  res.send("Welcome to the petoye backend API");
});

// Swagger UI setup
setupSwagger(app);

//Error Handling
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log("Listening at port number " + process.env.PORT);
});
