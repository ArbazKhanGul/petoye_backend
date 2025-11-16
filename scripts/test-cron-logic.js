/**
 * Test script to verify the nightly competition cron job logic
 * Run with: node scripts/test-cron-logic.js
 */

require("dotenv").config();
require("../src/config/db");

const {
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
} = require("../src/helpers/competitionHelper");

async function testCronLogic() {
  console.log("🧪 Testing nightly competition cron job logic...\n");

  try {
    // Step 1: End current competition
    console.log(
      "📊 Step 1: Ending current competition and selecting winners..."
    );
    const endedCompetition = await endCompetitionAndSelectWinners();

    if (endedCompetition) {
      console.log(`✅ Competition ${endedCompetition.date} ended successfully`);
      console.log(`   Status: ${endedCompetition.status}`);
      console.log(
        `   Prizes Distributed: ${endedCompetition.prizesDistributed}`
      );
      console.log(`   Total Entries: ${endedCompetition.totalEntries}`);
      console.log(`   Prize Pool: ${endedCompetition.prizePool} tokens`);

      if (endedCompetition.winners && endedCompetition.winners.length > 0) {
        console.log(`   Winners: ${endedCompetition.winners.length}`);
        endedCompetition.winners.forEach((winner, index) => {
          console.log(
            `      ${index + 1}. Entry ID: ${winner.entryId}, Prize: ${
              winner.prize
            } tokens`
          );
        });
      }
    } else {
      console.log("ℹ️ No competition to end at this time");
    }

    console.log("\n");

    // Step 2: Create tomorrow's competition
    console.log("📅 Step 2: Creating tomorrow's competition...");
    const tomorrowCompetition = await createTomorrowCompetition();

    if (tomorrowCompetition) {
      console.log(
        `✅ Tomorrow's competition created for ${tomorrowCompetition.date}`
      );
      console.log(`   Status: ${tomorrowCompetition.status}`);
      console.log(`   Entry Fee: ${tomorrowCompetition.entryFee} tokens`);
      console.log(
        `   Start Time: ${tomorrowCompetition.startTime.toISOString()}`
      );
      console.log(`   End Time: ${tomorrowCompetition.endTime.toISOString()}`);
      console.log(
        `   Entry Window: ${tomorrowCompetition.entryStartTime.toISOString()} to ${tomorrowCompetition.entryEndTime.toISOString()}`
      );
    }

    console.log("\n✅ Cron job logic test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error testing cron logic:", error);
    process.exit(1);
  }
}

testCronLogic();
