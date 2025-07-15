const mongoose = require("mongoose");
const RewardConfig = require("../src/models/rewardConfig.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/petoye";

const defaults = [
  { type: "referral", amount: 10 },
  { type: "like", amount: 1 },
  { type: "comment", amount: 2 },
];

async function seedRewardConfig() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  for (const def of defaults) {
    // Remove all existing records for this type
    await RewardConfig.deleteMany({ type: def.type });
    // Insert the default
    await RewardConfig.create(def);
    console.log(`Ensured single reward config for ${def.type}`);
  }
  await mongoose.disconnect();
  console.log("RewardConfig seeding complete.");
}

seedRewardConfig().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
