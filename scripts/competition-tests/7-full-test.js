/**
 * Full Test Flow
 * This script runs a complete test of the competition system
 *
 * Usage: node scripts/competition-tests/7-full-test.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
  createTomorrowCompetition,
} = require("../../src/helpers/competitionHelper");
const {
  Competition,
  CompetitionEntry,
  CompetitionVote,
  User,
} = require("../../src/models");
const crypto = require("crypto");

async function wait(seconds) {
  console.log(`\n⏳ Waiting ${seconds} seconds...\n`);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function run() {
  console.log("\n🚀 Full Competition Test Flow");
  console.log("=".repeat(60));
  console.log("This will:");
  console.log("  1. Create today's competition");
  console.log("  2. Add sample entries with votes");
  console.log("  3. End the competition and distribute prizes");
  console.log("  4. Create tomorrow's competition");
  console.log("=".repeat(60));

  await connectDB();

  try {
    // ========== STEP 1: Create Today's Competition ==========
    console.log("\n📅 STEP 1: Creating Today's Competition");
    console.log("-".repeat(60));

    const today = new Date().toISOString().split("T")[0];
    let competition = await Competition.findOne({ date: today });

    if (competition && competition.status === "completed") {
      console.log(
        "⚠️  Today's competition is already completed. Deleting it for fresh test..."
      );
      await CompetitionEntry.deleteMany({ competitionId: competition._id });
      await CompetitionVote.deleteMany({ competitionId: competition._id });
      await competition.deleteOne();
      competition = null;
    }

    if (!competition) {
      competition = await createDailyCompetition();
      console.log("✅ Competition created:", competition.date);
    } else {
      console.log("✅ Using existing competition:", competition.date);
    }

    console.log("  Prize Pool:", competition.prizePool, "tokens");
    console.log("  Entry Fee:", competition.entryFee, "tokens");

    await wait(1);

    // ========== STEP 2: Add Sample Entries ==========
    console.log("\n🎨 STEP 2: Adding Sample Entries with Votes");
    console.log("-".repeat(60));

    const users = await User.find().limit(8);

    if (users.length < 3) {
      console.log(
        "❌ Need at least 3 users! Please add users to the database first."
      );
      await disconnectDB();
      process.exit(1);
    }

    console.log(`Found ${users.length} users\n`);

    const samplePets = [
      { name: "Max", description: "Adorable golden retriever" },
      { name: "Luna", description: "Playful black cat" },
      { name: "Charlie", description: "Cute beagle puppy" },
      { name: "Bella", description: "Beautiful persian cat" },
      { name: "Rocky", description: "Strong german shepherd" },
      { name: "Daisy", description: "Sweet labrador" },
      { name: "Milo", description: "Curious tabby cat" },
      { name: "Coco", description: "Tiny chihuahua" },
    ];

    const entries = [];

    for (let i = 0; i < Math.min(users.length, samplePets.length); i++) {
      const user = users[i];
      const petData = samplePets[i];

      // Give user tokens if needed
      if (user.tokens < competition.entryFee) {
        user.tokens = 100;
        await user.save();
      }

      // Deduct entry fee
      user.tokens -= competition.entryFee;
      await user.save();

      // Create entry
      const entry = await CompetitionEntry.create({
        competitionId: competition._id,
        userId: user._id,
        petName: petData.name,
        description: petData.description,
        photoUrl: `https://via.placeholder.com/500?text=${petData.name}`,
        status: "active",
        votesCount: 0,
      });

      entries.push(entry);

      // Update competition
      competition.prizePool += competition.entryFee;
      competition.totalEntries += 1;

      console.log(`✅ ${entry.petName} by @${user.username}`);
    }

    await competition.save();

    // Add votes
    console.log("\n📊 Adding votes...\n");

    const allUsers = await User.find().limit(30);

    for (const entry of entries) {
      const numVotes = Math.floor(Math.random() * 20) + 5;

      for (let i = 0; i < Math.min(numVotes, allUsers.length); i++) {
        const voter = allUsers[i];

        const deviceFingerprint = crypto
          .createHash("sha256")
          .update(`${voter._id}-${entry._id}-${i}`)
          .digest("hex");

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

    const totalVotes = entries.reduce((sum, e) => sum + e.votesCount, 0);
    competition.totalVotes = totalVotes;
    await competition.save();

    console.log(
      `\n✅ Created ${entries.length} entries with ${totalVotes} total votes`
    );
    console.log("  Prize Pool:", competition.prizePool, "tokens");

    // Show leaderboard
    const sorted = entries.sort((a, b) => b.votesCount - a.votesCount);
    console.log("\n🏆 Current Leaderboard:");
    sorted.slice(0, 3).forEach((entry, index) => {
      const medals = ["🥇", "🥈", "🥉"];
      const user = users.find((u) => u._id.equals(entry.userId));
      console.log(
        `  ${medals[index]} ${entry.petName} by @${user.username} - ${entry.votesCount} votes`
      );
    });

    await wait(2);

    // ========== STEP 3: End Competition ==========
    console.log("\n🏁 STEP 3: Ending Competition and Distributing Prizes");
    console.log("-".repeat(60));

    // Force end time
    competition.endTime = new Date();
    await competition.save();

    const result = await endCompetitionAndSelectWinners();

    console.log("✅ Competition ended!");
    console.log("  Status:", result.status);
    console.log("  Prizes Distributed:", result.prizesDistributed);

    console.log("\n🏆 WINNERS:");

    if (result.winners.first) {
      const firstEntry = await CompetitionEntry.findById(
        result.winners.first.entryId
      ).populate("userId", "username tokens");
      console.log(
        `\n🥇 FIRST: ${firstEntry.petName} by @${firstEntry.userId.username}`
      );
      console.log(`   Votes: ${result.winners.first.votes}`);
      console.log(`   Prize: ${result.winners.first.prize} tokens`);
      console.log(`   New Balance: ${firstEntry.userId.tokens} tokens`);
    }

    if (result.winners.second) {
      const secondEntry = await CompetitionEntry.findById(
        result.winners.second.entryId
      ).populate("userId", "username tokens");
      console.log(
        `\n🥈 SECOND: ${secondEntry.petName} by @${secondEntry.userId.username}`
      );
      console.log(`   Votes: ${result.winners.second.votes}`);
      console.log(`   Prize: ${result.winners.second.prize} tokens`);
      console.log(`   New Balance: ${secondEntry.userId.tokens} tokens`);
    }

    if (result.winners.third) {
      const thirdEntry = await CompetitionEntry.findById(
        result.winners.third.entryId
      ).populate("userId", "username tokens");
      console.log(
        `\n🥉 THIRD: ${thirdEntry.petName} by @${thirdEntry.userId.username}`
      );
      console.log(`   Votes: ${result.winners.third.votes}`);
      console.log(`   Prize: ${result.winners.third.prize} tokens`);
      console.log(`   New Balance: ${thirdEntry.userId.tokens} tokens`);
    }

    await wait(1);

    // ========== STEP 4: Create Tomorrow's Competition ==========
    console.log("\n📅 STEP 4: Creating Tomorrow's Competition");
    console.log("-".repeat(60));

    const tomorrow = await createTomorrowCompetition();
    console.log("✅ Tomorrow's competition created!");
    console.log("  Date:", tomorrow.date);
    console.log("  Status:", tomorrow.status);
    console.log("  Starts:", tomorrow.startTime);

    console.log("\n" + "=".repeat(60));
    console.log("✅ FULL TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\nSummary:");
    console.log("  ✅ Created today's competition");
    console.log("  ✅ Added sample entries and votes");
    console.log("  ✅ Ended competition and distributed prizes");
    console.log("  ✅ Created tomorrow's competition");
    console.log("");
  } catch (error) {
    console.error("\n❌ Error in full test:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
