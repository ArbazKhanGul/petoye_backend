const mongoose = require("mongoose");


console.log("Connecting to MongoDB Atlas");
// Use the connection string from MongoDB Compass
const DB = process.env.DB;

mongoose.connect(DB, {
}).then(() => {
  console.log("Successfully connected to MongoDB Atlas");
}).catch((err) => {
  console.error("Error connecting to MongoDB Atlas:", err);
});

