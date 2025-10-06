/**
 * Create database indexes for optimized feed performance
 * Run with: node scripts/optimizeFeedIndexes.js
 */

const mongoose = require("mongoose");
const config = require("../src/config/database");

async function createFeedIndexes() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoURI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;

    // Index for posts collection (feed optimization)
    await db
      .collection("posts")
      .createIndex(
        { userId: 1, createdAt: -1 },
        { name: "posts_userId_createdAt_desc" }
      );

    // Index for excluding viewed posts
    await db
      .collection("posts")
      .createIndex({ _id: 1, userId: 1 }, { name: "posts_id_userId" });

    // Index for likes aggregation
    await db
      .collection("likes")
      .createIndex({ post: 1, user: 1 }, { name: "likes_post_user" });

    // Index for comments aggregation
    await db
      .collection("comments")
      .createIndex({ post: 1 }, { name: "comments_post" });

    // Index for post views
    await db
      .collection("postviews")
      .createIndex(
        { user: 1, viewedAt: -1 },
        { name: "postviews_user_viewedAt_desc" }
      );

    // Index for follows
    await db
      .collection("follows")
      .createIndex(
        { follower: 1, following: 1 },
        { name: "follows_follower_following" }
      );

    // Compound index for feed queries
    await db
      .collection("posts")
      .createIndex(
        { userId: 1, createdAt: -1, _id: 1 },
        { name: "posts_feed_compound" }
      );

    console.log("✅ All feed optimization indexes created successfully!");

    // Show existing indexes
    const indexes = await db.collection("posts").indexes();
    console.log("\n📊 Current Posts Collection Indexes:");
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
if (require.main === module) {
  createFeedIndexes();
}

module.exports = { createFeedIndexes };
