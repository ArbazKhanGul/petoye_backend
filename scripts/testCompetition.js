/**
 * Competition Testing Script
 * Run this script to test competition creation, completion, and winner selection
 *
 * Usage:
 * node scripts/testCompetition.js [command]
 *
 * Commands:
 * - create-today     : Create competition for today
 * - create-tomorrow  : Create competition for tomorrow
 * - end-active       : End active competition and select winners
 * - update-status    : Update competition statuses
 * - create-sample    : Create sample entries with votes
 * - full-test        : Run complete test flow
 */

const mongoose = require("mongoose");
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
  updateCompetitionStatuses,
} = require("../src/helpers/competitionHelper");
const {
  Competition,
  CompetitionEntry,
  CompetitionVote,
  User,
} = require("../src/models");
require("dotenv").config();

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Disconnect from MongoDB
async function disconnectDB() {
  await mongoose.connection.close();
  console.log("✅ MongoDB disconnected");
}

// 1. Create today's competition
async function testCreateToday() {
  console.log("\n📅 Testing: Create Today's Competition");
  console.log("=".repeat(50));

  try {
    const competition = await createDailyCompetition();
    console.log("\n✅ Competition created successfully!");
    console.log("Competition ID:", competition._id);
    console.log("Date:", competition.date);
    console.log("Status:", competition.status);
    console.log("Entry Fee:", competition.entryFee, "tokens");
    console.log("Start Time:", competition.startTime);
    console.log("End Time:", competition.endTime);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 2. Create tomorrow's competition
async function testCreateTomorrow() {
  console.log("\n📅 Testing: Create Tomorrow's Competition");
  console.log("=".repeat(50));

  try {
    const competition = await createTomorrowCompetition();
    console.log("\n✅ Competition created successfully!");
    console.log("Competition ID:", competition._id);
    console.log("Date:", competition.date);
    console.log("Status:", competition.status);
    console.log("Entry Fee:", competition.entryFee, "tokens");
    console.log("Start Time:", competition.startTime);
    console.log("End Time:", competition.endTime);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 3. End active competition
async function testEndCompetition() {
  console.log("\n🏁 Testing: End Active Competition");
  console.log("=".repeat(50));

  try {
    // First, get active competition
    const active = await Competition.findOne({ status: "active" });

    if (!active) {
      console.log("⚠️  No active competition found");
      return;
    }

    console.log("\nFound active competition:");
    console.log("Competition ID:", active._id);
    console.log("Date:", active.date);
    console.log("Total Entries:", active.totalEntries);
    console.log("Total Votes:", active.totalVotes);
    console.log("Prize Pool:", active.prizePool, "tokens");

    // Get top entries
    const entries = await CompetitionEntry.find({
      competitionId: active._id,
      status: "active",
    })
      .populate("userId", "fullName username")
      .sort({ votesCount: -1 })
      .limit(5);

    console.log("\nTop Entries:");
    entries.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${entry.petName} by @${entry.userId.username} - ${
          entry.votesCount
        } votes`
      );
    });

    // Force set endTime to now to allow ending
    active.endTime = new Date();
    await active.save();

    console.log("\n⏰ Forcing competition end time to NOW...");

    // End competition
    const result = await endCompetitionAndSelectWinners();

    if (result) {
      console.log("\n🏆 Competition ended successfully!");
      console.log("Status:", result.status);
      console.log("Prizes Distributed:", result.prizesDistributed);

      if (result.winners.first) {
        console.log("\n🥇 First Place:");
        console.log("  Votes:", result.winners.first.votes);
        console.log("  Prize:", result.winners.first.prize, "tokens");
      }

      if (result.winners.second) {
        console.log("\n🥈 Second Place:");
        console.log("  Votes:", result.winners.second.votes);
        console.log("  Prize:", result.winners.second.prize, "tokens");
      }

      if (result.winners.third) {
        console.log("\n🥉 Third Place:");
        console.log("  Votes:", result.winners.third.votes);
        console.log("  Prize:", result.winners.third.prize, "tokens");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 4. Update competition statuses
async function testUpdateStatuses() {
  console.log("\n🔄 Testing: Update Competition Statuses");
  console.log("=".repeat(50));

  try {
    await updateCompetitionStatuses();

    const competitions = await Competition.find()
      .sort({ startTime: -1 })
      .limit(5)
      .select("date status startTime endTime");

    console.log("\nRecent Competitions:");
    competitions.forEach((comp) => {
      console.log(`\n${comp.date}:`);
      console.log(`  Status: ${comp.status}`);
      console.log(`  Start: ${comp.startTime}`);
      console.log(`  End: ${comp.endTime}`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// 5. Create sample entries and votes for testing
async function createSampleData() {
  console.log("\n🎨 Creating Sample Entries and Votes");
  console.log("=".repeat(50));

  try {
    // Get or create active competition
    let competition = await Competition.findOne({ status: "active" });

    if (!competition) {
      console.log("No active competition found. Creating one...");
      competition = await createDailyCompetition();
    }

    console.log("\nUsing competition:", competition.date);

    // Get some users
    const users = await User.find().limit(5);

    if (users.length < 3) {
      console.log(
        "⚠️  Need at least 3 users in database. Please add users first."
      );
      return;
    }

    console.log(`\nFound ${users.length} users to create entries`);

    // Create entries
    const samplePets = [
      { name: "Max", description: "Adorable golden retriever" },
      { name: "Luna", description: "Playful black cat" },
      { name: "Charlie", description: "Cute beagle puppy" },
      { name: "Bella", description: "Beautiful persian cat" },
      { name: "Rocky", description: "Strong german shepherd" },
    ];

    const entries = [];

    for (let i = 0; i < Math.min(users.length, samplePets.length); i++) {
      const user = users[i];

      // Check if user already has entry
      const existing = await CompetitionEntry.findOne({
        competitionId: competition._id,
        userId: user._id,
      });

      if (existing) {
        console.log(`User ${user.username} already has an entry`);
        entries.push(existing);
        continue;
      }

      // Deduct entry fee
      if (user.tokens < competition.entryFee) {
        console.log(`User ${user.username} doesn't have enough tokens`);
        continue;
      }

      user.tokens -= competition.entryFee;
      await user.save();

      // Create entry
      const entry = await CompetitionEntry.create({
        competitionId: competition._id,
        userId: user._id,
        petName: samplePets[i].name,
        description: samplePets[i].description,
        photoUrl: "https://via.placeholder.com/500",
        status: "active",
        votesCount: 0,
      });

      entries.push(entry);

      // Update competition
      competition.prizePool += competition.entryFee;
      competition.totalEntries += 1;
      await competition.save();

      console.log(`✅ Created entry: ${entry.petName} by @${user.username}`);
    }

    // Create random votes
    console.log("\n📊 Creating random votes...");

    const allUsers = await User.find().limit(20);

    for (const entry of entries) {
      // Random number of votes (0-15)
      const numVotes = Math.floor(Math.random() * 16);

      for (let i = 0; i < numVotes && i < allUsers.length; i++) {
        const voter = allUsers[i];

        // Create device fingerprint
        const deviceFingerprint = require("crypto")
          .createHash("sha256")
          .update(`${voter._id}-device-${i}`)
          .digest("hex");

        // Check if already voted
        const existingVote = await CompetitionVote.findOne({
          competitionId: competition._id,
          deviceFingerprint,
        });

        if (existingVote) continue;

        // Create vote
        await CompetitionVote.create({
          competitionId: competition._id,
          entryId: entry._id,
          userId: voter._id,
          deviceFingerprint,
          ipAddress: "127.0.0.1",
        });

        entry.votesCount += 1;
      }

      await entry.save();
      console.log(`  ${entry.petName}: ${entry.votesCount} votes`);
    }

    // Update total votes
    const totalVotes = entries.reduce((sum, e) => sum + e.votesCount, 0);
    competition.totalVotes = totalVotes;
    await competition.save();

    console.log(
      `\n✅ Created ${entries.length} entries with ${totalVotes} total votes`
    );
    console.log(`Prize Pool: ${competition.prizePool} tokens`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

// 6. Full test flow
async function runFullTest() {
  console.log("\n🚀 Running Full Competition Test Flow");
  console.log("=".repeat(50));

  try {
    // Step 1: Create today's competition
    await testCreateToday();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 2: Create sample data
    await createSampleData();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: View current state
    const active = await Competition.findOne({ status: "active" });
    if (active) {
      const entries = await CompetitionEntry.find({
        competitionId: active._id,
      }).populate("userId", "username");

      console.log("\n📊 Current Competition State:");
      console.log("Total Entries:", entries.length);
      console.log("Prize Pool:", active.prizePool, "tokens");
      console.log("\nLeaderboard:");

      const sorted = entries.sort((a, b) => b.votesCount - a.votesCount);
      sorted.slice(0, 3).forEach((entry, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        console.log(
          `${medals[index]} ${entry.petName} by @${entry.userId.username} - ${entry.votesCount} votes`
        );
      });
    }

    // Step 4: End competition
    console.log("\n⏳ Waiting 2 seconds before ending competition...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await testEndCompetition();

    // Step 5: Create tomorrow's competition
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testCreateTomorrow();

    console.log("\n✅ Full test completed successfully!");
  } catch (error) {
    console.error("❌ Error in full test:", error.message);
  }
}

// 7. View all competitions
async function viewAllCompetitions() {
  console.log("\n📋 All Competitions");
  console.log("=".repeat(50));

  try {
    const competitions = await Competition.find().sort({ date: -1 }).limit(10);

    for (const comp of competitions) {
      console.log(`\n${comp.date} [${comp.status.toUpperCase()}]`);
      console.log(`  Entries: ${comp.totalEntries}`);
      console.log(`  Votes: ${comp.totalVotes}`);
      console.log(`  Prize Pool: ${comp.prizePool} tokens`);
      console.log(`  Prizes Distributed: ${comp.prizesDistributed}`);

      if (comp.winners.first) {
        console.log(
          `  🥇 Winner: ${comp.winners.first.votes} votes, ${comp.winners.first.prize} tokens`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Main function
async function main() {
  await connectDB();

  const command = process.argv[2] || "help";

  switch (command) {
    case "create-today":
      await testCreateToday();
      break;

    case "create-tomorrow":
      await testCreateTomorrow();
      break;

    case "end-active":
      await testEndCompetition();
      break;

    case "update-status":
      await testUpdateStatuses();
      break;

    case "create-sample":
      await createSampleData();
      break;

    case "full-test":
      await runFullTest();
      break;

    case "view-all":
      await viewAllCompetitions();
      break;

    case "help":
    default:
      console.log("\n📖 Competition Testing Script");
      console.log("=".repeat(50));
      console.log("\nAvailable commands:");
      console.log("  create-today    - Create competition for today");
      console.log("  create-tomorrow - Create competition for tomorrow");
      console.log(
        "  end-active      - End active competition and select winners"
      );
      console.log("  update-status   - Update competition statuses");
      console.log("  create-sample   - Create sample entries with votes");
      console.log("  full-test       - Run complete test flow");
      console.log("  view-all        - View all competitions");
      console.log("  help            - Show this help message");
      console.log("\nUsage:");
      console.log("  node scripts/testCompetition.js [command]");
      console.log("\nExample:");
      console.log("  node scripts/testCompetition.js full-test");
      console.log("");
      break;
  }

  await disconnectDB();
  process.exit(0);
}

// Run main function
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
