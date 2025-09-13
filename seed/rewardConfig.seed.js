const mongoose = require("mongoose");
const RewardConfig = require("../src/models/rewardConfig.model");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://petoye:petoyeTestAccount@ac-g5lcvme-shard-00-00.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-01.vhhw18j.mongodb.net:27017,ac-g5lcvme-shard-00-02.vhhw18j.mongodb.net:27017/petoyedb?ssl=true&replicaSet=atlas-3fccf5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=petoye";

const defaults = [
  {
    type: "referral",
    title: "Invite Friends",
    description:
      "Share your referral code and earn tokens when friends join PetOye!",
    amount: 50,
    icon: "users",
    category: "referral",
    status: "active",
    hasAction: true,
    priority: 1,
  },
  {
    type: "like",
    title: "Get Likes on Posts",
    description:
      "Share amazing pet content and earn tokens when others appreciate your posts",
    amount: 10,
    icon: "heart",
    category: "action",
    status: "active",
    hasAction: false,
    priority: 2,
  },
  {
    type: "daily_checkin",
    title: "Daily Check-in",
    description: "Visit the app daily and earn consistent bonus tokens",
    amount: 5,
    icon: "calendar",
    category: "achievement",
    status: "coming_soon",
    hasAction: false,
    priority: 3,
  },
  {
    type: "profile_complete",
    title: "Complete Profile",
    description: "Add profile details, photos, and earn a one-time bonus",
    amount: 25,
    icon: "user-check",
    category: "achievement",
    status: "coming_soon",
    hasAction: false,
    priority: 4,
  },
  {
    type: "share_content",
    title: "Share Content",
    description: "Share pet posts to social media and spread the love",
    amount: 15,
    icon: "share-2",
    category: "action",
    status: "coming_soon",
    hasAction: false,
    priority: 5,
  },
  {
    type: "weekly_challenge",
    title: "Weekly Challenges",
    description: "Complete special challenges and earn premium rewards",
    amount: 100,
    icon: "award",
    category: "achievement",
    status: "coming_soon",
    hasAction: false,
    priority: 6,
  },
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
