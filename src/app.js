require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middleware/errorMiddleware");
require("./config/db")

const app = express();


app.use(
  cors({
    origin: ["*",process.env.CLIENT_URL],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
app.use('/api/user', user);

app.get("/",(req,res)=>{
  res.send("Welcome to the smart cab")
});


//Error Handling
app.use(errorMiddleware);

server.listen(process.env.PORT, () => {
  console.log("Listening at port number " + process.env.PORT);
});