/**
 * Database Connection Helper
 * Shared by all competition test scripts
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      "mongodb://petoye:petoyeTestAccount@ac-g5lcvme-shard-00-00.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-01.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-02.vhhw18j.mongodb.net:27017/petoyedb?ssl=true&replicaSet=atlas-3fccf5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=petoye"
    );
    console.log("✅ MongoDB connected");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

// Disconnect from MongoDB
async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting:", error.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
