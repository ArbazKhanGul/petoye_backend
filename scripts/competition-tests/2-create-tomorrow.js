/**
 * Create Tomorrow's Competition
 * This script creates a competition for tomorrow
 *
 * Usage: node scripts/competition-tests/2-create-tomorrow.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  createTomorrowCompetition,
} = require("../../src/helpers/competitionHelper");
const { Competition } = require("../../src/models");

async function run() {
  console.log("\n🎯 Creating Tomorrow's Competition");
  console.log("=".repeat(60));

  await connectDB();

  try {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    // Check if already exists
    const existing = await Competition.findOne({ date: tomorrowDate });

    if (existing) {
      console.log("\n⚠️  Competition already exists for tomorrow!");
      console.log("Competition ID:", existing._id);
      console.log("Date:", existing.date);
      console.log("Status:", existing.status);
      console.log("Entry Fee:", existing.entryFee, "tokens");
      console.log("Prize Pool:", existing.prizePool, "tokens");
      console.log("Total Entries:", existing.totalEntries);
      console.log("Total Votes:", existing.totalVotes);
      console.log("\nStart Time:", existing.startTime);
      console.log("End Time:", existing.endTime);
    } else {
      // Create new competition
      console.log("\n⏳ Creating competition for tomorrow...");
      const competition = await createTomorrowCompetition();

      console.log("\n✅ Tomorrow's Competition Created Successfully!");
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
      console.log(
        "\n💡 Users can start submitting entries 1 hour before competition starts!"
      );
    }
  } catch (error) {
    console.error("\n❌ Error creating tomorrow's competition:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
