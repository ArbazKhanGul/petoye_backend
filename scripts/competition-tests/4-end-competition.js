/**
 * End Active Competition and Distribute Prizes
 * This script ends the active competition and selects winners
 *
 * Usage: node scripts/competition-tests/4-end-competition.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  endCompetitionAndSelectWinners,
} = require("../../src/helpers/competitionHelper");
const { Competition, CompetitionEntry, User } = require("../../src/models");

async function run() {
  console.log("\n🏁 Ending Active Competition");
  console.log("=".repeat(60));

  await connectDB();

  try {
    // Find active competition
    const competition = await Competition.findOne({ status: "active" });

    if (!competition) {
      console.log("❌ No active competition found!");
      console.log("💡 Run 1-create-today.js to create a competition");
      await disconnectDB();
      process.exit(1);
    }

    console.log("\n✅ Found active competition:");
    console.log("  Date:", competition.date);
    console.log("  Total Entries:", competition.totalEntries);
    console.log("  Total Votes:", competition.totalVotes);
    console.log("  Prize Pool:", competition.prizePool, "tokens");
    console.log("  End Time:", competition.endTime);

    // Get top entries before ending
    const topEntries = await CompetitionEntry.find({
      competitionId: competition._id,
      status: "active",
    })
      .populate("userId", "fullName username tokens")
      .sort({ votesCount: -1, createdAt: 1 })
      .limit(5);

    if (topEntries.length === 0) {
      console.log("\n⚠️  No entries found in this competition!");
      console.log("💡 Run 3-add-sample-entries.js to add entries first");
      await disconnectDB();
      process.exit(1);
    }

    console.log("\n📊 Top Entries Before Ending:");
    topEntries.forEach((entry, index) => {
      console.log(
        `  ${index + 1}. ${entry.petName} by @${entry.userId.username}`
      );
      console.log(
        `     Votes: ${entry.votesCount} | User Tokens: ${entry.userId.tokens}`
      );
    });

    // Check if competition can end
    const now = new Date();
    const shouldEnd = competition.endTime <= now;

    if (!shouldEnd) {
      console.log("\n⚠️  Competition end time has not been reached yet!");
      console.log("  Current Time:", now);
      console.log("  End Time:", competition.endTime);
      console.log("\n⏰ Forcing end time to NOW for testing...");

      // Force end time to now
      competition.endTime = new Date();
      await competition.save();
    }

    console.log("\n⏳ Ending competition and distributing prizes...\n");

    // End competition
    const result = await endCompetitionAndSelectWinners();

    if (!result) {
      console.log("❌ Failed to end competition");
      await disconnectDB();
      process.exit(1);
    }

    console.log("\n✅ Competition Ended Successfully!");
    console.log("=".repeat(60));

    // Calculate prizes
    const prizePool = result.prizePool;
    const firstPrize = Math.floor(prizePool * 0.5);
    const secondPrize = Math.floor(prizePool * 0.3);
    const thirdPrize = prizePool - firstPrize - secondPrize;

    console.log("\nCompetition Summary:");
    console.log("  Date:", result.date);
    console.log("  Status:", result.status);
    console.log("  Total Entries:", result.totalEntries);
    console.log("  Total Votes:", result.totalVotes);
    console.log("  Prize Pool:", result.prizePool, "tokens");
    console.log("  Prizes Distributed:", result.prizesDistributed);

    console.log("\n🏆 Winners:");

    // First place
    if (result.winners.first) {
      const firstEntry = await CompetitionEntry.findById(
        result.winners.first.entryId
      ).populate("userId", "fullName username tokens");

      if (firstEntry) {
        console.log("\n🥇 FIRST PLACE:");
        console.log(`  Pet: ${firstEntry.petName}`);
        console.log(
          `  Owner: @${firstEntry.userId.username} (${firstEntry.userId.fullName})`
        );
        console.log(`  Votes: ${result.winners.first.votes}`);
        console.log(`  Prize: ${result.winners.first.prize} tokens (50%)`);
        console.log(`  New Token Balance: ${firstEntry.userId.tokens} tokens`);
      } else {
        console.log("\n🥇 FIRST PLACE:");
        console.log(`  Entry ID: ${result.winners.first.entryId}`);
        console.log(`  Votes: ${result.winners.first.votes}`);
        console.log(`  Prize: ${result.winners.first.prize} tokens (50%)`);
        console.log("  ⚠️  Entry details not found");
      }
    }

    // Second place
    if (result.winners.second) {
      const secondEntry = await CompetitionEntry.findById(
        result.winners.second.entryId
      ).populate("userId", "fullName username tokens");

      if (secondEntry) {
        console.log("\n🥈 SECOND PLACE:");
        console.log(`  Pet: ${secondEntry.petName}`);
        console.log(
          `  Owner: @${secondEntry.userId.username} (${secondEntry.userId.fullName})`
        );
        console.log(`  Votes: ${result.winners.second.votes}`);
        console.log(`  Prize: ${result.winners.second.prize} tokens (30%)`);
        console.log(`  New Token Balance: ${secondEntry.userId.tokens} tokens`);
      } else {
        console.log("\n🥈 SECOND PLACE:");
        console.log(`  Entry ID: ${result.winners.second.entryId}`);
        console.log(`  Votes: ${result.winners.second.votes}`);
        console.log(`  Prize: ${result.winners.second.prize} tokens (30%)`);
        console.log("  ⚠️  Entry details not found");
      }
    }

    // Third place
    if (result.winners.third) {
      const thirdEntry = await CompetitionEntry.findById(
        result.winners.third.entryId
      ).populate("userId", "fullName username tokens");

      if (thirdEntry) {
        console.log("\n🥉 THIRD PLACE:");
        console.log(`  Pet: ${thirdEntry.petName}`);
        console.log(
          `  Owner: @${thirdEntry.userId.username} (${thirdEntry.userId.fullName})`
        );
        console.log(`  Votes: ${result.winners.third.votes}`);
        console.log(`  Prize: ${result.winners.third.prize} tokens (20%)`);
        console.log(`  New Token Balance: ${thirdEntry.userId.tokens} tokens`);
      } else {
        console.log("\n🥉 THIRD PLACE:");
        console.log(`  Entry ID: ${result.winners.third.entryId}`);
        console.log(`  Votes: ${result.winners.third.votes}`);
        console.log(`  Prize: ${result.winners.third.prize} tokens (20%)`);
        console.log("  ⚠️  Entry details not found");
      }
    }

    console.log("\n✅ All prizes have been distributed!");
    console.log("💡 Run 2-create-tomorrow.js to create the next competition");
  } catch (error) {
    console.error("\n❌ Error ending competition:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
