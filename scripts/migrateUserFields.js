const mongoose = require("mongoose");
const { User } = require("../src/models");
const { generateUsername } = require("../src/helpers/usernameGenerator");
require("dotenv").config();

async function migrateUserFields() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to database");

    // Find users without username or bio fields
    const usersToUpdate = await User.find({
      $or: [{ username: { $exists: false } }, { bio: { $exists: false } }],
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (const user of usersToUpdate) {
      const updates = {};

      // Add username if missing
      if (!user.username) {
        const username = await generateUsername(user.email, user.fullName);
        updates.username = username;
        console.log(`Generated username "${username}" for user ${user.email}`);
      }

      // Add empty bio if missing
      if (!user.bio) {
        updates.bio = "";
      }

      // Update user
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log(`Updated user ${user.email} with:`, updates);
      }
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run migration
if (require.main === module) {
  migrateUserFields();
}

module.exports = migrateUserFields;
