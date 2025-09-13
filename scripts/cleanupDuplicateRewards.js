const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

const TokenTransaction = require("../src/models/tokenTransaction.model");
const User = require("../src/models/user.model");

async function cleanupDuplicateRewards() {
  try {
    console.log("🧹 Starting cleanup of duplicate rewards...");

    // Find duplicate like rewards for the same post-liker combination
    const duplicates = await TokenTransaction.aggregate([
      {
        $match: {
          type: "like",
          "metadata.likerId": { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            user: "$user", // Post owner
            relatedId: "$relatedId", // Post ID
            likerId: "$metadata.likerId", // Liker
          },
          transactions: { $push: "$_id" },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } }, // Only groups with duplicates
      },
    ]);

    console.log(`Found ${duplicates.length} sets of duplicate rewards`);

    let totalTokensToDeduct = 0;
    let totalDuplicatesRemoved = 0;

    for (const duplicate of duplicates) {
      const { user, relatedId, likerId } = duplicate._id;
      const transactions = duplicate.transactions;
      const duplicateAmount =
        duplicate.totalAmount - duplicate.totalAmount / duplicate.count; // Amount to deduct

      console.log(
        `Processing duplicates for post ${relatedId}, liker ${likerId}: ${duplicate.count} rewards found`
      );

      // Keep the first transaction, remove the rest
      const transactionsToRemove = transactions.slice(1);

      // Remove duplicate transactions
      await TokenTransaction.deleteMany({
        _id: { $in: transactionsToRemove },
      });

      // Deduct excess tokens from user
      await User.findByIdAndUpdate(user, {
        $inc: { tokens: -duplicateAmount },
      });

      totalTokensToDeduct += duplicateAmount;
      totalDuplicatesRemoved += transactionsToRemove.length;

      console.log(
        `✅ Removed ${transactionsToRemove.length} duplicate transactions, deducted ${duplicateAmount} tokens`
      );
    }

    console.log("🎯 Cleanup Summary:");
    console.log(`- Removed ${totalDuplicatesRemoved} duplicate transactions`);
    console.log(`- Deducted ${totalTokensToDeduct} excess tokens from users`);
    console.log("✅ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run cleanup
cleanupDuplicateRewards();
