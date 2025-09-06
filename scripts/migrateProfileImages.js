const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

// Import User model
const { User } = require("../src/models");

// Paths
const imagesDir = path.join(__dirname, "../images");
const profileDir = path.join(imagesDir, "profile");

// Ensure profile directory exists
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

async function migrateProfileImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all files in the images directory
    const files = fs.readdirSync(imagesDir);

    // Filter for profile image files (they start with 'profileImage-')
    const profileImages = files.filter(
      (file) =>
        file.startsWith("profileImage-") &&
        fs.statSync(path.join(imagesDir, file)).isFile()
    );

    console.log(
      `Found ${profileImages.length} profile images to migrate:`,
      profileImages
    );

    for (const filename of profileImages) {
      const oldPath = path.join(imagesDir, filename);
      const newPath = path.join(profileDir, filename);

      try {
        // Move the file
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Moved: ${filename}`);

        // Update database paths for users with this image
        const oldDbPath = `/images/${filename}`;
        const newDbPath = `/images/profile/${filename}`;

        const updateResult = await User.updateMany(
          { profileImage: oldDbPath },
          { $set: { profileImage: newDbPath } }
        );

        if (updateResult.modifiedCount > 0) {
          console.log(
            `✅ Updated ${updateResult.modifiedCount} user(s) with path: ${newDbPath}`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
      }
    }

    console.log("\n🎉 Profile image migration completed!");

    // Verify the migration
    const usersWithOldPaths = await User.find({
      profileImage: {
        $regex: "^/images/profileImage-",
        $not: { $regex: "^/images/profile/" },
      },
    });

    if (usersWithOldPaths.length > 0) {
      console.log(
        `⚠️  Warning: ${usersWithOldPaths.length} users still have old profile image paths`
      );
      usersWithOldPaths.forEach((user) => {
        console.log(`   - User: ${user.username}, Path: ${user.profileImage}`);
      });
    } else {
      console.log("✅ All profile image paths have been updated successfully");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the migration
migrateProfileImages();
