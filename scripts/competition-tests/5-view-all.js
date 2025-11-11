/**
 * View All Competitions
 * This script displays all competitions and their details
 *
 * Usage: node scripts/competition-tests/5-view-all.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const { Competition, CompetitionEntry } = require("../../src/models");

async function run() {
  console.log("\n📋 View All Competitions");
  console.log("=".repeat(60));

  await connectDB();

  try {
    const competitions = await Competition.find()
      .sort({ date: -1 })
      .populate("winners.first.entryId", "petName")
      .populate("winners.second.entryId", "petName")
      .populate("winners.third.entryId", "petName")
      .limit(20);

    if (competitions.length === 0) {
      console.log("\n⚠️  No competitions found!");
      console.log("💡 Run 1-create-today.js to create a competition");
      await disconnectDB();
      process.exit(0);
    }

    console.log(`\n✅ Found ${competitions.length} competitions\n`);

    for (const comp of competitions) {
      const statusEmoji = {
        active: "🟢",
        upcoming: "🔵",
        completed: "⚫",
      };

      console.log("=".repeat(60));
      console.log(
        `${statusEmoji[comp.status]} ${
          comp.date
        } [${comp.status.toUpperCase()}]`
      );
      console.log("=".repeat(60));
      console.log("Competition Details:");
      console.log("  ID:", comp._id);
      console.log("  Entry Fee:", comp.entryFee, "tokens");
      console.log("  Prize Pool:", comp.prizePool, "tokens");
      console.log("  Total Entries:", comp.totalEntries);
      console.log("  Total Votes:", comp.totalVotes);
      console.log(
        "  Prizes Distributed:",
        comp.prizesDistributed ? "Yes" : "No"
      );

      console.log("\nTime Settings:");
      console.log("  Start:", comp.startTime);
      console.log("  End:", comp.endTime);
      console.log(
        "  Entry Window:",
        comp.entryStartTime,
        "to",
        comp.entryEndTime
      );

      // Show winners if completed
      if (comp.status === "completed" && comp.winners.first) {
        console.log("\n🏆 Winners:");

        if (comp.winners.first?.entryId) {
          console.log(
            `  🥇 First: ${comp.winners.first.entryId.petName} - ${comp.winners.first.votes} votes, ${comp.winners.first.prize} tokens`
          );
        }

        if (comp.winners.second?.entryId) {
          console.log(
            `  🥈 Second: ${comp.winners.second.entryId.petName} - ${comp.winners.second.votes} votes, ${comp.winners.second.prize} tokens`
          );
        }

        if (comp.winners.third?.entryId) {
          console.log(
            `  🥉 Third: ${comp.winners.third.entryId.petName} - ${comp.winners.third.votes} votes, ${comp.winners.third.prize} tokens`
          );
        }
      }

      // Show top entries for active competitions
      if (comp.status === "active" && comp.totalEntries > 0) {
        const topEntries = await CompetitionEntry.find({
          competitionId: comp._id,
          status: "active",
        })
          .populate("userId", "username")
          .sort({ votesCount: -1 })
          .limit(3);

        if (topEntries.length > 0) {
          console.log("\n📊 Current Top 3:");
          topEntries.forEach((entry, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            console.log(
              `  ${medals[index]} ${entry.petName} by @${entry.userId.username} - ${entry.votesCount} votes`
            );
          });
        }
      }

      console.log("");
    }

    // Statistics
    const stats = {
      total: competitions.length,
      active: competitions.filter((c) => c.status === "active").length,
      upcoming: competitions.filter((c) => c.status === "upcoming").length,
      completed: competitions.filter((c) => c.status === "completed").length,
      totalPrizes: competitions.reduce((sum, c) => sum + (c.prizePool || 0), 0),
      totalEntries: competitions.reduce(
        (sum, c) => sum + (c.totalEntries || 0),
        0
      ),
      totalVotes: competitions.reduce((sum, c) => sum + (c.totalVotes || 0), 0),
    };

    console.log("=".repeat(60));
    console.log("📊 Overall Statistics");
    console.log("=".repeat(60));
    console.log("Total Competitions:", stats.total);
    console.log("  🟢 Active:", stats.active);
    console.log("  🔵 Upcoming:", stats.upcoming);
    console.log("  ⚫ Completed:", stats.completed);
    console.log("\nAll-Time Totals:");
    console.log("  Total Prize Pool:", stats.totalPrizes, "tokens");
    console.log("  Total Entries:", stats.totalEntries);
    console.log("  Total Votes:", stats.totalVotes);
    console.log("");
  } catch (error) {
    console.error("\n❌ Error viewing competitions:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
