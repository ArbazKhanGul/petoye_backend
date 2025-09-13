const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const TokenTransaction = require("../src/models/tokenTransaction.model");
const Like = require("../src/models/like.model");

async function migrateRewardSystem() {
  try {
    console.log("🚀 Starting reward system migration...");

    // Step 1: Add metadata field to existing transactions
    console.log("📝 Adding metadata field to existing transactions...");

    await TokenTransaction.updateMany(
      { metadata: { $exists: false } },
      { $set: { metadata: {} } }
    );

    // Step 2: For existing like rewards, try to match them with actual likes
    console.log("🔗 Matching existing like rewards with actual likes...");

    const likeTransactions = await TokenTransaction.find({
      type: "like",
      "metadata.likerId": { $exists: false },
    });

    console.log(
      `Found ${likeTransactions.length} like transactions to process`
    );

    for (const transaction of likeTransactions) {
      // Find corresponding like for this post
      const like = await Like.findOne({
        post: transaction.relatedId,
        postOwner: transaction.user,
      });

      if (like) {
        await TokenTransaction.findByIdAndUpdate(transaction._id, {
          $set: {
            "metadata.likerId": like.user,
            "metadata.likeId": like._id,
          },
        });
        console.log(
          `✅ Updated transaction ${transaction._id} with like metadata`
        );
      } else {
        console.log(
          `⚠️  Could not find matching like for transaction ${transaction._id}`
        );
      }
    }

    // Step 3: Create indexes for efficient querying
    console.log("📊 Creating database indexes...");

    await TokenTransaction.collection.createIndex({
      user: 1,
      type: 1,
      relatedId: 1,
      "metadata.likerId": 1,
    });

    console.log("✅ Migration completed successfully!");
    console.log("📈 Reward system is now protected against duplicate rewards");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration
migrateRewardSystem();
