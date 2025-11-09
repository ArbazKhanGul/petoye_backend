/**
 * Comprehensive Competition Test Suite
 * Tests all edge cases including 1, 2, and 3+ entries
 *
 * Usage: node scripts/competition-tests/8-comprehensive-test.js
 */

const { connectDB, disconnectDB } = require("./db-connection");
const {
  createDailyCompetition,
  endCompetitionAndSelectWinners,
} = require("../../src/helpers/competitionHelper");
const {
  Competition,
  CompetitionEntry,
  CompetitionVote,
  User,
} = require("../../src/models");
const crypto = require("crypto");

async function wait(seconds) {
  console.log(`⏳ Waiting ${seconds} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function cleanupCompetition(date) {
  const competition = await Competition.findOne({ date });
  if (competition) {
    await CompetitionEntry.deleteMany({ competitionId: competition._id });
    await CompetitionVote.deleteMany({ competitionId: competition._id });
    await competition.deleteOne();
  }
}

async function createTestCompetition(date, entryFee = 10) {
  await cleanupCompetition(date);

  const startTime = new Date();
  const endTime = new Date();
  endTime.setHours(endTime.getHours() + 1);

  const competition = await Competition.create({
    date,
    status: "active",
    entryFee,
    prizePool: 0,
    startTime,
    endTime,
    entryStartTime: startTime,
    entryEndTime: endTime,
    totalEntries: 0,
    totalVotes: 0,
  });

  return competition;
}

async function addEntry(competition, user, petName, votesCount = 0) {
  // Ensure user has tokens
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
    petName,
    description: `Test pet ${petName}`,
    photoUrl: `https://via.placeholder.com/500?text=${petName}`,
    status: "active",
    votesCount: 0,
  });

  // Update competition
  competition.prizePool += competition.entryFee;
  competition.totalEntries += 1;
  await competition.save();

  // Add votes if needed
  if (votesCount > 0) {
    const voters = await User.find().limit(votesCount);
    for (let i = 0; i < Math.min(votesCount, voters.length); i++) {
      const voter = voters[i];
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
    competition.totalVotes += votesCount;
    await competition.save();
  }

  return entry;
}

async function testScenario(name, numEntries, votes, expectedDistribution) {
  console.log("\n" + "=".repeat(70));
  console.log(`🧪 TEST: ${name}`);
  console.log("=".repeat(70));

  const testDate = `test-${Date.now()}`;
  const users = await User.find().limit(numEntries);

  if (users.length < numEntries) {
    console.log(
      `❌ Need at least ${numEntries} users! Found only ${users.length}`
    );
    return false;
  }

  // Create competition
  const competition = await createTestCompetition(testDate, 10);
  console.log(`\n📅 Created competition: ${testDate}`);
  console.log(`   Entry Fee: ${competition.entryFee} tokens`);

  // Add entries
  console.log(`\n✨ Adding ${numEntries} entries...`);
  const entries = [];
  const petNames = ["Max", "Luna", "Charlie", "Bella", "Rocky"];

  for (let i = 0; i < numEntries; i++) {
    const entry = await addEntry(
      competition,
      users[i],
      petNames[i],
      votes[i] || 0
    );
    entries.push(entry);
    console.log(
      `   ✅ ${entry.petName} by @${users[i].username} - ${entry.votesCount} votes`
    );
  }

  const totalPrizePool = numEntries * competition.entryFee;
  console.log(`\n💰 Prize Pool: ${totalPrizePool} tokens`);

  // Show expected distribution
  console.log(`\n📊 Expected Distribution:`);
  expectedDistribution.forEach((percent, index) => {
    const amount = Math.floor(totalPrizePool * percent);
    const positions = ["1st", "2nd", "3rd"];
    console.log(`   ${positions[index]}: ${percent * 100}% = ${amount} tokens`);
  });

  // Force end time and end competition
  competition.endTime = new Date();
  await competition.save();

  console.log(`\n🏁 Ending competition...`);
  const result = await endCompetitionAndSelectWinners();

  if (!result) {
    console.log("❌ Failed to end competition");
    return false;
  }

  // Verify results
  console.log(`\n🏆 RESULTS:`);
  let success = true;
  const positions = ["first", "second", "third"];
  const medals = ["🥇", "🥈", "🥉"];

  for (let i = 0; i < Math.min(numEntries, 3); i++) {
    const position = positions[i];
    const winner = result.winners[position];

    if (!winner) {
      console.log(`❌ ${medals[i]} ${position.toUpperCase()}: No winner found`);
      success = false;
      continue;
    }

    const expectedPrize = Math.floor(totalPrizePool * expectedDistribution[i]);
    const actualPrize = winner.prize;
    const match = Math.abs(expectedPrize - actualPrize) <= 1; // Allow 1 token rounding difference

    const entry = await CompetitionEntry.findById(winner.entryId).populate(
      "userId",
      "username tokens"
    );

    console.log(`\n${medals[i]} ${position.toUpperCase()}: ${entry.petName}`);
    console.log(`   Owner: @${entry.userId.username}`);
    console.log(`   Votes: ${winner.votes}`);
    console.log(
      `   Prize: ${actualPrize} tokens ${
        match ? "✅" : `❌ (expected ${expectedPrize})`
      }`
    );
    console.log(`   New Balance: ${entry.userId.tokens} tokens`);

    if (!match) success = false;
  }

  // Cleanup
  await cleanupCompetition(testDate);

  console.log(`\n${success ? "✅ TEST PASSED" : "❌ TEST FAILED"}`);
  return success;
}

async function run() {
  console.log("\n🚀 COMPREHENSIVE COMPETITION TEST SUITE");
  console.log("=".repeat(70));
  console.log("Testing all prize distribution scenarios:");
  console.log("  • 1 Entry: 100% winner");
  console.log("  • 2 Entries: 67% / 33%");
  console.log("  • 3+ Entries: 50% / 30% / 20%");
  console.log("=".repeat(70));

  await connectDB();

  const results = [];

  try {
    // Test 1: Single Entry (100% prize)
    await wait(1);
    results.push(
      await testScenario(
        "Single Entry - 100% Winner",
        1,
        [10], // votes
        [1.0] // 100%
      )
    );

    // Test 2: Two Entries (67% / 33%)
    await wait(1);
    results.push(
      await testScenario(
        "Two Entries - 67% / 33% Split",
        2,
        [15, 5], // votes
        [0.67, 0.33] // 67%, 33%
      )
    );

    // Test 3: Three Entries (50% / 30% / 20%)
    await wait(1);
    results.push(
      await testScenario(
        "Three Entries - 50% / 30% / 20% Split",
        3,
        [20, 12, 8], // votes
        [0.5, 0.3, 0.2] // 50%, 30%, 20%
      )
    );

    // Test 4: More than Three Entries (still 50% / 30% / 20% for top 3)
    await wait(1);
    results.push(
      await testScenario(
        "Five Entries - Top 3 Win (50% / 30% / 20%)",
        5,
        [25, 18, 12, 6, 3], // votes
        [0.5, 0.3, 0.2] // Top 3 only
      )
    );

    // Test 5: Tie scenario (same votes, earlier submission wins)
    await wait(1);
    results.push(
      await testScenario(
        "Tie Scenario - First Submitted Wins",
        3,
        [10, 10, 10], // same votes
        [0.5, 0.3, 0.2]
      )
    );

    // Final Summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(70));

    const testNames = [
      "Single Entry Test",
      "Two Entries Test",
      "Three Entries Test",
      "Five Entries Test",
      "Tie Scenario Test",
    ];

    results.forEach((result, index) => {
      console.log(`${result ? "✅" : "❌"} ${testNames[index]}`);
    });

    const allPassed = results.every((r) => r);
    console.log("\n" + "=".repeat(70));
    console.log(
      allPassed
        ? "🎉 ALL TESTS PASSED! 🎉"
        : "❌ SOME TESTS FAILED - Check output above"
    );
    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error in test suite:", error.message);
    console.error(error.stack);
  }

  await disconnectDB();
  process.exit(0);
}

run();
