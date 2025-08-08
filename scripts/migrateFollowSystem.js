const mongoose = require('mongoose');
const { User, Follow } = require('../models');

/**
 * Migration script to convert array-based follow system to collection-based system
 * This script should be run once to migrate existing data
 */
async function migrateFollowSystem() {
  try {
    console.log('Starting follow system migration...');

    // Get all users that have followers or following arrays
    const usersWithFollows = await User.find({
      $or: [
        { followers: { $exists: true, $not: { $size: 0 } } },
        { following: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    console.log(`Found ${usersWithFollows.length} users with follow data to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithFollows) {
      try {
        console.log(`Migrating user: ${user.fullName} (${user._id})`);

        // Migrate following relationships
        if (user.following && user.following.length > 0) {
          for (const followingId of user.following) {
            try {
              // Check if relationship already exists in Follow collection
              const existingFollow = await Follow.findOne({
                follower: user._id,
                following: followingId
              });

              if (!existingFollow) {
                await Follow.create({
                  follower: user._id,
                  following: followingId
                });
                console.log(`  Created follow relationship: ${user._id} -> ${followingId}`);
              }
            } catch (error) {
              console.error(`  Error creating follow relationship: ${error.message}`);
              errorCount++;
            }
          }
        }

        // Update counts based on Follow collection
        const followingCount = await Follow.countDocuments({ follower: user._id });
        const followersCount = await Follow.countDocuments({ following: user._id });

        await User.findByIdAndUpdate(user._id, {
          followingCount,
          followersCount,
          // Remove the old arrays (optional - can be done later for safety)
          // $unset: { followers: 1, following: 1 }
        });

        console.log(`  Updated counts - Following: ${followingCount}, Followers: ${followersCount}`);
        migratedCount++;

      } catch (error) {
        console.error(`Error migrating user ${user._id}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`Migration completed!`);
    console.log(`Successfully migrated: ${migratedCount} users`);
    console.log(`Errors encountered: ${errorCount}`);

    // Verify migration
    const totalFollowRecords = await Follow.countDocuments();
    console.log(`Total follow relationships in new collection: ${totalFollowRecords}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Clean up old array fields (run this after verifying migration worked correctly)
 */
async function cleanupOldArrays() {
  try {
    console.log('Cleaning up old follower/following arrays...');

    const result = await User.updateMany(
      {},
      {
        $unset: {
          followers: 1,
          following: 1
        }
      }
    );

    console.log(`Cleaned up arrays from ${result.modifiedCount} users`);
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

/**
 * Verify data integrity after migration
 */
async function verifyMigration() {
  try {
    console.log('Verifying migration integrity...');

    const users = await User.find({}).select('_id followersCount followingCount');
    let mismatchCount = 0;

    for (const user of users) {
      const actualFollowingCount = await Follow.countDocuments({ follower: user._id });
      const actualFollowersCount = await Follow.countDocuments({ following: user._id });

      if (user.followingCount !== actualFollowingCount || user.followersCount !== actualFollowersCount) {
        console.log(`Mismatch for user ${user._id}:`);
        console.log(`  Following - Stored: ${user.followingCount}, Actual: ${actualFollowingCount}`);
        console.log(`  Followers - Stored: ${user.followersCount}, Actual: ${actualFollowersCount}`);
        mismatchCount++;

        // Fix the counts
        await User.findByIdAndUpdate(user._id, {
          followingCount: actualFollowingCount,
          followersCount: actualFollowersCount
        });
      }
    }

    if (mismatchCount === 0) {
      console.log('✅ All user counts match the Follow collection data');
    } else {
      console.log(`⚠️  Fixed ${mismatchCount} count mismatches`);
    }

  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

module.exports = {
  migrateFollowSystem,
  cleanupOldArrays,
  verifyMigration
};

// If running this file directly
if (require.main === module) {
  const runMigration = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petoye');
      console.log('Connected to MongoDB');

      // Run migration
      await migrateFollowSystem();
      
      // Verify migration
      await verifyMigration();

      console.log('Migration completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  };

  runMigration();
}
