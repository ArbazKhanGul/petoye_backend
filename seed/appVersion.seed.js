const mongoose = require("mongoose");
const { AppVersion } = require("../src/models");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://petoye:petoyeTestAccount@ac-g5lcvme-shard-00-00.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-01.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-02.vhhw18j.mongodb.net:27017/petoyedb?ssl=true&replicaSet=atlas-3fccf5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=petoye";

const versionConfig = [
  {
    platform: "android",
    minimumVersion: "1.0.0",
    latestVersion: "1.0.0",
    updateMessage:
      "A new version of the app is available with exciting features!",
    forceUpdateMessage:
      "Please update your app to continue using the latest security features.",
    isActive: true,
  },
  {
    platform: "ios",
    minimumVersion: "1.0.0",
    latestVersion: "1.0.0",
    updateMessage:
      "A new version of the app is available with exciting features!",
    forceUpdateMessage:
      "Please update your app to continue using the latest security features.",
    isActive: true,
  },
];

async function seedAppVersions() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB successfully!");

    console.log("🌱 Seeding app versions...");

    // Delete existing versions first
    const deletedCount = await AppVersion.deleteMany({});
    console.log(
      `🗑️  Deleted ${deletedCount.deletedCount} existing app versions`
    );

    // Insert new versions
    const insertedVersions = await AppVersion.insertMany(versionConfig);
    console.log("✅ App versions seeded successfully!");
    console.log("📱 Seeded versions:");
    insertedVersions.forEach((version) => {
      console.log(
        `- ${version.platform}: ${version.latestVersion} (min: ${version.minimumVersion})`
      );
    });

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");

    return insertedVersions;
  } catch (error) {
    console.error("❌ Error seeding app versions:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("👋 Disconnected from MongoDB due to error");
    }
    throw error;
  }
}

// Run seeder if this script is run directly
if (require.main === module) {
  seedAppVersions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  seedAppVersions,
};
