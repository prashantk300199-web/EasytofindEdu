/**
 * Migration Script: Set referralRewardsGiven flag for existing users
 *
 * Run this ONCE after deploying the new referral system to prevent
 * existing users from receiving duplicate welcome bonuses.
 *
 * This marks all existing verified users as having already received
 * their referral rewards.
 */

import mongoose from 'mongoose';
import Student from '../models/Students.js';
import User from '../models/User.js';
import InstituteOwner from '../models/InstituteOwner.js';
import env from '../config/env.js';

async function migrateReferralRewards() {
  try {
    console.log('🚀 Starting referral rewards migration...');
    console.log('📊 Connecting to MongoDB...');

    await mongoose.connect(env.mongodb.url);
    console.log('✅ Connected to MongoDB');

    // Update all verified students who don't have the flag set
    const studentsResult = await Student.updateMany(
      {
        status: 'verified',
        $or: [
          { referralRewardsGiven: { $exists: false } },
          { referralRewardsGiven: false }
        ]
      },
      {
        $set: { referralRewardsGiven: true }
      }
    );

    console.log(`✅ Updated ${studentsResult.modifiedCount} students`);

    // Update all verified owners
    const ownersResult = await User.updateMany(
      {
        status: 'verified',
        $or: [
          { referralRewardsGiven: { $exists: false } },
          { referralRewardsGiven: false }
        ]
      },
      {
        $set: { referralRewardsGiven: true }
      }
    );

    console.log(`✅ Updated ${ownersResult.modifiedCount} owners`);

    // Update all verified institute owners
    const instituteOwnersResult = await InstituteOwner.updateMany(
      {
        status: 'verified',
        $or: [
          { referralRewardsGiven: { $exists: false } },
          { referralRewardsGiven: false }
        ]
      },
      {
        $set: { referralRewardsGiven: true }
      }
    );

    console.log(`✅ Updated ${instituteOwnersResult.modifiedCount} institute owners`);

    const totalUpdated = studentsResult.modifiedCount +
                        ownersResult.modifiedCount +
                        instituteOwnersResult.modifiedCount;

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Total users updated: ${totalUpdated}`);
    console.log(`\n⚠️ NOTE: Pending (unverified) users were NOT updated.`);
    console.log(`   They will receive rewards when they verify their email.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateReferralRewards();
