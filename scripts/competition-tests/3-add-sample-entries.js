/**
 * Add Sample Entries to Active Competition
 * This script creates sample pet entries with random votes
 *
 * Usage: node scripts/competition-tests/3-add-sample-entries.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  Competition,
  CompetitionEntry,
  CompetitionVote,
  User,
} = require("../../src/models");
const crypto = require("crypto");

async function run() {
  console.log("\n🎨 Adding Sample Entries to Active Competition");
  console.log("=".repeat(60));

  await connectDB();

  try {
    // Find active competition
    const competition = await Competition.findOne({ status: "active" });

    if (!competition) {
      console.log("❌ No active competition found!");
      console.log("💡 Run 1-create-today.js first to create a competition");
      await disconnectDB();
      process.exit(1);
    }

    console.log("\n✅ Found active competition:");
    console.log("  Date:", competition.date);
    console.log("  Current Entries:", competition.totalEntries);
    console.log("  Current Prize Pool:", competition.prizePool, "tokens");

    // Get users
    const users = await User.find().limit(10);

    if (users.length < 3) {
      console.log("\n❌ Need at least 3 users in database!");
      console.log("💡 Please add some users first");
      await disconnectDB();
      process.exit(1);
    }

    console.log(`\n✅ Found ${users.length} users`);

    // Sample pet data
    const samplePets = [
      {
        name: "Max",
        description: "Adorable golden retriever who loves to play fetch",
      },
      {
        name: "Luna",
        description: "Playful black cat with beautiful green eyes",
      },
      {
        name: "Charlie",
        description: "Cute beagle puppy, always happy and energetic",
      },
      {
        name: "Bella",
        description: "Beautiful persian cat with silky white fur",
      },
      {
        name: "Rocky",
        description: "Strong german shepherd, loyal and protective",
      },
      { name: "Daisy", description: "Sweet labrador who loves swimming" },
      { name: "Milo", description: "Curious orange tabby cat, very friendly" },
      { name: "Coco", description: "Tiny chihuahua with a big personality" },
      { name: "Shadow", description: "Mysterious black cat, loves to cuddle" },
      { name: "Buddy", description: "Friendly golden doodle, great with kids" },
    ];

    const createdEntries = [];

    console.log("\n⏳ Creating sample entries...\n");

    for (let i = 0; i < Math.min(users.length, samplePets.length); i++) {
      const user = users[i];
      const petData = samplePets[i];

      // Check if user already has entry
      const existingEntry = await CompetitionEntry.findOne({
        competitionId: competition._id,
        userId: user._id,
      });

      if (existingEntry) {
        console.log(
          `⚠️  User @${user.username} already has an entry: ${existingEntry.petName}`
        );
        createdEntries.push(existingEntry);
        continue;
      }

      // Check if user has enough tokens
      if (user.tokens < competition.entryFee) {
        console.log(
          `⚠️  User @${user.username} doesn't have enough tokens (has: ${user.tokens}, needs: ${competition.entryFee})`
        );

        // Give user tokens for testing
        user.tokens = 100;
        await user.save();
        console.log(`   💰 Added 100 tokens to @${user.username} for testing`);
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
        photoUrl:
          "https://via.placeholder.com/500x500.png?text=" + petData.name,
        status: "active",
        votesCount: 0,
      });

      createdEntries.push(entry);

      // Update competition
      competition.prizePool += competition.entryFee;
      competition.totalEntries += 1;

      console.log(`✅ Created entry: ${entry.petName} by @${user.username}`);
    }

    await competition.save();

    // Add random votes
    console.log("\n⏳ Adding random votes to entries...\n");

    const allUsers = await User.find().limit(50);

    for (const entry of createdEntries) {
      // Random number of votes between 5 and 25
      const numVotes = Math.floor(Math.random() * 21) + 5;

      for (let i = 0; i < Math.min(numVotes, allUsers.length); i++) {
        const voter = allUsers[i];

        // Create unique device fingerprint
        const deviceFingerprint = crypto
          .createHash("sha256")
          .update(`${voter._id}-device-${i}-${entry._id}`)
          .digest("hex");

        // Check if already voted
        const existingVote = await CompetitionVote.findOne({
          competitionId: competition._id,
          entryId: entry._id,
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
      console.log(`  📊 ${entry.petName}: ${entry.votesCount} votes`);
    }

    // Update total votes
    const totalVotes = createdEntries.reduce((sum, e) => sum + e.votesCount, 0);
    competition.totalVotes = totalVotes;
    await competition.save();

    console.log("\n✅ Sample Data Created Successfully!");
    console.log("=".repeat(60));
    console.log("\nCompetition Summary:");
    console.log("  Total Entries:", competition.totalEntries);
    console.log("  Total Votes:", competition.totalVotes);
    console.log("  Prize Pool:", competition.prizePool, "tokens");

    // Show leaderboard
    const sortedEntries = createdEntries.sort(
      (a, b) => b.votesCount - a.votesCount
    );

    console.log("\n🏆 Current Leaderboard:");
    const medals = ["🥇", "🥈", "🥉"];
    sortedEntries.slice(0, 3).forEach((entry, index) => {
      const user = users.find((u) => u._id.equals(entry.userId));
      console.log(
        `  ${medals[index]} ${entry.petName} by @${user?.username} - ${entry.votesCount} votes`
      );
    });

    console.log(
      "\n💡 Run 4-end-competition.js to complete the competition and distribute prizes!"
    );
  } catch (error) {
    console.error("\n❌ Error creating sample entries:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
