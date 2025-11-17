const cron = require("node-cron");
const {
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
} = require("../helpers/competitionHelper");

/**
 * Initialize all competition cron jobs
 */
function initializeCompetitionJobs() {
  console.log("⏰ Initializing competition cron jobs...");

  // Job 1: End competition and select winners + Create tomorrow's competition
  // Runs every night at 23:59 UTC (11:59 PM - 1 minute before midnight)
  cron.schedule(
    "59 23 * * *",
    async () => {
      console.log("🎯 Running nightly competition jobs...");
      console.log(`⏰ Time: ${new Date().toISOString()}`);

      try {
        // First, end the current competition and select winners
        console.log("📊 Ending current competition and selecting winners...");
        const endedCompetition = await endCompetitionAndSelectWinners();

        if (endedCompetition) {
          console.log(
            `✅ Competition ${endedCompetition.date} ended successfully`
          );
          console.log(`🏆 Winners selected and prizes distributed`);
        } else {
          console.log("ℹ️ No competition to end at this time");
        }

        // Then, create tomorrow's competition
        console.log("📅 Creating tomorrow's competition...");
        const tomorrowCompetition = await createTomorrowCompetition();

        if (tomorrowCompetition) {
          console.log(
            `✅ Tomorrow's competition created for ${tomorrowCompetition.date}`
          );
          console.log(`📝 Status: ${tomorrowCompetition.status}`);
        }

        console.log("✅ Nightly competition jobs completed successfully");
      } catch (error) {
        console.error("❌ Error in nightly competition jobs:", error);
        // Log error but don't crash the server
      }
    },
    // {
    //   timezone: "UTC",
    // }
    {
      timezone: "Asia/Karachi", // ★ Important
    }
  );

  // Job 2: Update competition statuses (activate upcoming competitions)
  // Runs every hour to ensure competitions are activated on time
  cron.schedule(
    "0 * * * *",
    async () => {
      console.log("🔄 Updating competition statuses...");
      try {
        await updateCompetitionStatuses();
      } catch (error) {
        console.error("❌ Error updating competition statuses:", error);
      }
    },
    // {
    //   timezone: "UTC",
    // }
    {
      timezone: "Asia/Karachi", // ★ Important
    }
  );

  console.log("✅ Competition cron jobs initialized:");
  console.log(
    "   - Nightly job (23:59 UTC): End competition + Create tomorrow's competition"
  );
  console.log("   - Hourly job (every hour): Update competition statuses");
}

module.exports = { initializeCompetitionJobs };
