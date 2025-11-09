/**
 * Create Today's Competition
 * This script creates a competition for the current day
 *
 * Usage: node scripts/competition-tests/1-create-today.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  createDailyCompetition,
} = require("../../src/helpers/competitionHelper");
const { Competition } = require("../../src/models");

async function run() {
  console.log("\n🎯 Creating Today's Competition");
  console.log("=".repeat(60));

  await connectDB();

  try {
    // Check if already exists
    const today = new Date().toISOString().split("T")[0];
    const existing = await Competition.findOne({ date: today });

    if (existing) {
      console.log("\n⚠️  Competition already exists for today!");
      console.log("Competition ID:", existing._id);
      console.log("Date:", existing.date);
      console.log("Status:", existing.status);
      console.log("Entry Fee:", existing.entryFee, "tokens");
      console.log("Prize Pool:", existing.prizePool, "tokens");
      console.log("Total Entries:", existing.totalEntries);
      console.log("Total Votes:", existing.totalVotes);
      console.log("\nStart Time:", existing.startTime);
      console.log("End Time:", existing.endTime);
      console.log("Entry Start:", existing.entryStartTime);
      console.log("Entry End:", existing.entryEndTime);
    } else {
      // Create new competition
      console.log("\n⏳ Creating competition...");
      const competition = await createDailyCompetition();

      console.log("\n✅ Competition Created Successfully!");
      console.log("=".repeat(60));
      console.log("\nCompetition Details:");
      console.log("  ID:", competition._id);
      console.log("  Date:", competition.date);
      console.log("  Status:", competition.status);
      console.log("  Entry Fee:", competition.entryFee, "tokens");
      console.log(
        "  Prize Pool:",
        competition.prizePool,
        "tokens (starts at 0)"
      );
      console.log("  Total Entries:", competition.totalEntries);
      console.log("  Total Votes:", competition.totalVotes);
      console.log("\nTime Settings:");
      console.log("  Start Time:", competition.startTime);
      console.log("  End Time:", competition.endTime);
      console.log("  Entry Window Start:", competition.entryStartTime);
      console.log("  Entry Window End:", competition.entryEndTime);
      console.log("\n💡 Users can now submit entries for this competition!");
    }
  } catch (error) {
    console.error("\n❌ Error creating competition:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
