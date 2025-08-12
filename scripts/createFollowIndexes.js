const mongoose = require("mongoose");

/**
 * Create optimized indexes for the Follow collection
 * This ensures fast queries for follow/unfollow operations and follower/following lists
 */
async function createFollowIndexes() {
  try {
    console.log("Creating indexes for Follow collection...");

    const db = mongoose.connection.db;
    const followCollection = db.collection("follows");

    // 1. Unique compound index to prevent duplicate follows
    await followCollection.createIndex(
      { follower: 1, following: 1 },
      { unique: true, name: "unique_follow_relationship" }
    );
    console.log("✅ Created unique compound index for follow relationships");

    // 2. Index for getting user's following list (sorted by creation date)
    await followCollection.createIndex(
      { follower: 1, createdAt: -1 },
      { name: "follower_createdAt" }
    );
    console.log("✅ Created index for following lists");

    // 3. Index for getting user's followers list (sorted by creation date)
    await followCollection.createIndex(
      { following: 1, createdAt: -1 },
      { name: "following_createdAt" }
    );
    console.log("✅ Created index for followers lists");

    // 4. Additional indexes for better performance
    await followCollection.createIndex(
      { follower: 1 },
      { name: "follower_index" }
    );
    console.log("✅ Created follower index");

    await followCollection.createIndex(
      { following: 1 },
      { name: "following_index" }
    );
    console.log("✅ Created following index");

    await followCollection.createIndex(
      { createdAt: -1 },
      { name: "createdAt_index" }
    );
    console.log("✅ Created createdAt index");

    // List all indexes to verify
    const indexes = await followCollection.listIndexes().toArray();
    console.log("\nAll indexes on Follow collection:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log("\n✅ All Follow collection indexes created successfully!");
  } catch (error) {
    console.error("Error creating indexes:", error);
    throw error;
  }
}

/**
 * Create indexes for User collection to optimize follow-related queries
 */
async function createUserFollowIndexes() {
  try {
    console.log("Creating follow-related indexes for User collection...");

    const db = mongoose.connection.db;
    const userCollection = db.collection("users");

    // Index for followersCount and followingCount for sorting/filtering
    await userCollection.createIndex(
      { followersCount: -1 },
      { name: "followersCount_desc" }
    );
    console.log("✅ Created followersCount index");

    await userCollection.createIndex(
      { followingCount: -1 },
      { name: "followingCount_desc" }
    );
    console.log("✅ Created followingCount index");

    // Compound index for popular users (high follower count)
    await userCollection.createIndex(
      { followersCount: -1, createdAt: -1 },
      { name: "popular_users" }
    );
    console.log("✅ Created popular users compound index");

    console.log("✅ All User collection follow indexes created successfully!");
  } catch (error) {
    console.error("Error creating user indexes:", error);
    throw error;
  }
}

/**
 * Drop old indexes if they exist (cleanup)
 */
async function cleanupOldIndexes() {
  try {
    console.log("Cleaning up old indexes...");

    const db = mongoose.connection.db;
    const userCollection = db.collection("users");

    // Try to drop old array-based indexes if they exist
    const userIndexes = await userCollection.listIndexes().toArray();
    const oldIndexNames = userIndexes
      .filter(
        (idx) =>
          idx.name.includes("followers") || idx.name.includes("following")
      )
      .filter(
        (idx) =>
          idx.name !== "followersCount_desc" &&
          idx.name !== "followingCount_desc" &&
          idx.name !== "popular_users"
      )
      .map((idx) => idx.name);

    for (const indexName of oldIndexNames) {
      try {
        await userCollection.dropIndex(indexName);
        console.log(`✅ Dropped old index: ${indexName}`);
      } catch (error) {
        // Index might not exist, which is fine
        console.log(`Index ${indexName} doesn't exist or already dropped`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up old indexes:", error);
    // Don't throw, this is not critical
  }
}

module.exports = {
  createFollowIndexes,
  createUserFollowIndexes,
  cleanupOldIndexes,
};

// If running this file directly
if (require.main === module) {
  const runIndexCreation = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/petoye"
      );
      console.log("Connected to MongoDB");

      // Clean up old indexes
      await cleanupOldIndexes();

      // Create new indexes
      await createFollowIndexes();
      await createUserFollowIndexes();

      console.log("\n🎉 All indexes created successfully!");
      console.log("\nYour follow system is now optimized for scale!");

      process.exit(0);
    } catch (error) {
      console.error("Index creation failed:", error);
      process.exit(1);
    }
  };

  runIndexCreation();
}
