/**
 * Update Competition Statuses
 * This script updates all competition statuses based on current time
 *
 * Usage: node scripts/competition-tests/6-update-statuses.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  updateCompetitionStatuses,
} = require("../../src/helpers/competitionHelper");
const { Competition } = require("../../src/models");

async function run() {
  console.log("\n🔄 Updating Competition Statuses");
  console.log("=".repeat(60));

  await connectDB();

  try {
    const now = new Date();
    console.log("\nCurrent Time:", now);

    // Get competitions before update
    const beforeActive = await Competition.countDocuments({ status: "active" });
    const beforeUpcoming = await Competition.countDocuments({
      status: "upcoming",
    });
    const beforeCompleted = await Competition.countDocuments({
      status: "completed",
    });

    console.log("\n📊 Status Before Update:");
    console.log("  Active:", beforeActive);
    console.log("  Upcoming:", beforeUpcoming);
    console.log("  Completed:", beforeCompleted);

    // Find competitions that will be affected
    const toActivate = await Competition.find({
      status: "upcoming",
      startTime: { $lte: now },
    }).select("date startTime");

    if (toActivate.length > 0) {
      console.log("\n📢 Competitions to be activated:");
      toActivate.forEach((comp) => {
        console.log(`  • ${comp.date} (Start: ${comp.startTime})`);
      });
    }

    console.log("\n⏳ Updating statuses...");

    // Run update
    await updateCompetitionStatuses();

    // Get competitions after update
    const afterActive = await Competition.countDocuments({ status: "active" });
    const afterUpcoming = await Competition.countDocuments({
      status: "upcoming",
    });
    const afterCompleted = await Competition.countDocuments({
      status: "completed",
    });

    console.log("\n✅ Status After Update:");
    console.log("  Active:", afterActive);
    console.log("  Upcoming:", afterUpcoming);
    console.log("  Completed:", afterCompleted);

    // Show changes
    const changes = {
      active: afterActive - beforeActive,
      upcoming: afterUpcoming - beforeUpcoming,
      completed: afterCompleted - beforeCompleted,
    };

    console.log("\n📈 Changes:");
    console.log(
      "  Active:",
      changes.active >= 0 ? `+${changes.active}` : changes.active
    );
    console.log(
      "  Upcoming:",
      changes.upcoming >= 0 ? `+${changes.upcoming}` : changes.upcoming
    );
    console.log(
      "  Completed:",
      changes.completed >= 0 ? `+${changes.completed}` : changes.completed
    );

    // Show current active and upcoming
    const activeCompetitions = await Competition.find({
      status: "active",
    }).select("date startTime endTime totalEntries totalVotes prizePool");

    const upcomingCompetitions = await Competition.find({ status: "upcoming" })
      .select("date startTime endTime")
      .sort({ startTime: 1 })
      .limit(3);

    if (activeCompetitions.length > 0) {
      console.log("\n🟢 Active Competitions:");
      activeCompetitions.forEach((comp) => {
        console.log(`\n  ${comp.date}`);
        console.log(`    Entries: ${comp.totalEntries}`);
        console.log(`    Votes: ${comp.totalVotes}`);
        console.log(`    Prize Pool: ${comp.prizePool} tokens`);
        console.log(`    Ends: ${comp.endTime}`);
      });
    } else {
      console.log("\n⚠️  No active competitions");
    }

    if (upcomingCompetitions.length > 0) {
      console.log("\n🔵 Upcoming Competitions:");
      upcomingCompetitions.forEach((comp) => {
        console.log(`  • ${comp.date} - Starts: ${comp.startTime}`);
      });
    } else {
      console.log("\n⚠️  No upcoming competitions");
    }

    console.log("\n✅ Status update completed!");
  } catch (error) {
    console.error("\n❌ Error updating statuses:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
