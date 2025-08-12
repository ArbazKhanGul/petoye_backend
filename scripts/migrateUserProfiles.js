const mongoose = require("mongoose");
require("dotenv").config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Helper function to generate username from email or name
const generateUsername = async (email, name = null) => {
  const { User } = require("../src/models");

  let baseUsername;

  if (name) {
    baseUsername = name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 20);
  } else {
    baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "");
  }

  if (baseUsername.length < 3) {
    baseUsername = baseUsername + Math.random().toString(36).substring(2, 5);
  }

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = baseUsername + counter;
    counter++;

    if (counter > 9999) {
      username = baseUsername + Date.now().toString().slice(-4);
      break;
    }
  }

  return username;
};

const migrateUserProfiles = async () => {
  try {
    await connectDB();

    const { User } = require("../src/models");

    console.log("Starting user profile migration...");

    // Find users without username or bio fields
    const usersToUpdate = await User.find({
      $or: [{ username: { $exists: false } }, { bio: { $exists: false } }],
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (let user of usersToUpdate) {
      const updates = {};

      // Add username if missing
      if (!user.username) {
        updates.username = await generateUsername(user.email, user.fullName);
        console.log(
          `Generated username: ${updates.username} for user: ${user.email}`
        );
      }

      // Add bio field if missing
      if (user.bio === undefined) {
        updates.bio = "";
      }

      // Update user if there are changes
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`Updated user: ${user.email}`);
      }
    }

    console.log("✅ User profile migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
    process.exit(0);
  }
};

// Run migration
if (require.main === module) {
  migrateUserProfiles();
}

module.exports = { migrateUserProfiles };
