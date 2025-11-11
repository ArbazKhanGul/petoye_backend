const {
  Competition,
  CompetitionEntry,
  User,
  TokenTransaction,
} = require("../models");

/**
 * Create daily competition
 * Called by cron job at 00:00 UTC
 */
async function createDailyCompetition() {
  try {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // Check if competition for today already exists
    const existing = await Competition.findOne({ date: dateString });
    if (existing) {
      console.log(`Competition for ${dateString} already exists`);
      return existing;
    }

    // Set times
    const startTime = new Date(now);
    startTime.setUTCHours(0, 0, 0, 0);

    const endTime = new Date(now);
    endTime.setUTCHours(23, 59, 59, 999);

    // Entry window: 1 hour before start (23:00 previous day) to 1 hour before end (22:59)
    const entryStartTime = new Date(startTime);
    entryStartTime.setHours(entryStartTime.getHours() - 1);

    const entryEndTime = new Date(endTime);
    entryEndTime.setHours(entryEndTime.getHours() - 1);

    // Create competition
    const competition = await Competition.create({
      date: dateString,
      status: "active",
      entryFee: 1, // Default entry fee (can be configurable)
      prizePool: 0,
      startTime,
      endTime,
      entryStartTime,
      entryEndTime,
      totalEntries: 0,
      totalVotes: 0,
    });

    console.log(`✅ Created daily competition for ${dateString}`);
    return competition;
  } catch (error) {
    console.error("Error creating daily competition:", error);
    throw error;
  }
}

/**
 * End competition and select winners
 * Called by cron job at 23:59 UTC
 */
async function endCompetitionAndSelectWinners() {
  try {
    const now = new Date();

    // Find active competition that should end
    const competition = await Competition.findOne({
      status: "active",
      endTime: { $lte: now },
      prizesDistributed: false,
    });

    if (!competition) {
      console.log("No competition to end at this time");
      return null;
    }

    console.log(`Ending competition: ${competition.date}`);

    // Get top 3 entries by vote count
    const topEntries = await CompetitionEntry.find({
      competitionId: competition._id,
      status: "active",
    })
      .sort({ votesCount: -1, createdAt: 1 }) // Sort by votes desc, then by submission time asc
      .limit(3);

    if (topEntries.length === 0) {
      // No entries, mark as completed
      competition.status = "completed";
      competition.prizesDistributed = true;
      await competition.save();
      console.log(`Competition ${competition.date} completed with no entries`);
      return competition;
    }

    // Calculate prizes based on number of entries
    const prizePool = competition.prizePool;
    let prizes = [];

    if (topEntries.length === 1) {
      // Only 1 entry: winner gets 100%
      prizes = [prizePool];
    } else if (topEntries.length === 2) {
      // 2 entries: 67% and 33%
      const firstPrize = Math.floor(prizePool * 0.67);
      const secondPrize = prizePool - firstPrize;
      prizes = [firstPrize, secondPrize];
    } else {
      // 3 or more entries: 50%, 30%, 20%
      const firstPrize = Math.floor(prizePool * 0.5);
      const secondPrize = Math.floor(prizePool * 0.3);
      const thirdPrize = prizePool - firstPrize - secondPrize;
      prizes = [firstPrize, secondPrize, thirdPrize];
    }

    const positions = ["first", "second", "third"];

    // Distribute prizes and update winners
    for (let i = 0; i < topEntries.length; i++) {
      const entry = topEntries[i];
      const prize = prizes[i];
      const position = positions[i];

      if (prize > 0) {
        // Add tokens to winner
        await User.findByIdAndUpdate(entry.userId, {
          $inc: { tokens: prize },
        });

        // Record transaction
        await TokenTransaction.create({
          user: entry.userId,
          amount: prize,
          type: "competition_prize",
          relatedId: entry._id,
          metadata: {
            competitionId: competition._id,
            entryId: entry._id,
            position: i + 1,
          },
        });

        // Update entry rank
        entry.rank = i + 1;
        await entry.save();

        // Update competition winners
        competition.winners[position] = {
          entryId: entry._id,
          userId: entry.userId,
          votes: entry.votesCount,
          prize: prize,
        };

        console.log(
          `🏆 ${position.toUpperCase()}: User ${
            entry.userId
          } won ${prize} tokens (${entry.votesCount} votes)`
        );
      }
    }

    // Mark competition as completed
    competition.status = "completed";
    competition.prizesDistributed = true;
    await competition.save();

    console.log(`✅ Competition ${competition.date} completed successfully`);
    console.log(`   Winners saved: ${Object.keys(competition.winners).length}`);

    // Return populated competition
    const populatedCompetition = await Competition.findById(competition._id)
      .populate({
        path: "winners.first.entryId",
        select: "petName photoUrl votesCount userId",
      })
      .populate({
        path: "winners.second.entryId",
        select: "petName photoUrl votesCount userId",
      })
      .populate({
        path: "winners.third.entryId",
        select: "petName photoUrl votesCount userId",
      });

    return populatedCompetition;
  } catch (error) {
    console.error("Error ending competition:", error);
    throw error;
  }
}

/**
 * Create tomorrow's competition
 * Called by cron job at 01:00 UTC (allows users to enter for next day)
 */
async function createTomorrowCompetition() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];

    // Check if competition already exists
    const existing = await Competition.findOne({ date: dateString });
    if (existing) {
      console.log(`Competition for ${dateString} already exists`);
      return existing;
    }

    // Set times for tomorrow
    const startTime = new Date(tomorrow);
    startTime.setUTCHours(0, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setUTCHours(23, 59, 59, 999);

    // Entry window: Start 1 hour after creation, end 1 hour before competition starts
    const entryStartTime = new Date(); // Current time when competition is created
    entryStartTime.setHours(entryStartTime.getHours() + 1); // Start accepting entries 1 hour from now

    const entryEndTime = new Date(startTime); // Competition start time
    entryEndTime.setHours(entryEndTime.getHours() - 1); // Close entries 1 hour before competition starts

    // Create competition
    const competition = await Competition.create({
      date: dateString,
      status: "upcoming",
      entryFee: 10,
      prizePool: 0,
      startTime,
      endTime,
      entryStartTime,
      entryEndTime,
      totalEntries: 0,
      totalVotes: 0,
    });

    console.log(`✅ Created upcoming competition for ${dateString}`);
    return competition;
  } catch (error) {
    console.error("Error creating tomorrow's competition:", error);
    throw error;
  }
}

/**
 * Update competition statuses
 * Called periodically to ensure correct status
 */
async function updateCompetitionStatuses() {
  try {
    const now = new Date();

    // Activate upcoming competitions that should start
    await Competition.updateMany(
      {
        status: "upcoming",
        startTime: { $lte: now },
      },
      {
        $set: { status: "active" },
      }
    );

    console.log("✅ Competition statuses updated");
  } catch (error) {
    console.error("Error updating competition statuses:", error);
  }
}

module.exports = {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
};
