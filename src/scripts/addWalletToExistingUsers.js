import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Students from '../models/Students.js';
import User from '../models/User.js';
import InstituteOwner from '../models/InstituteOwner.js';

dotenv.config();

async function addWalletToExistingUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update Students without wallet
    const studentsUpdated = await Students.updateMany(
      { 'wallet.coins': { $exists: false } },
      {
        $set: {
          wallet: {
            coins: 500,
            transactions: [{
              type: 'credit',
              amount: 500,
              description: 'Welcome bonus for existing user!',
              timestamp: new Date(),
            }]
          }
        }
      }
    );

    // Update Users (owners) without wallet
    const usersUpdated = await User.updateMany(
      { 'wallet.coins': { $exists: false } },
      {
        $set: {
          wallet: {
            coins: 500,
            transactions: [{
              type: 'credit',
              amount: 500,
              description: 'Welcome bonus for existing user!',
              timestamp: new Date(),
            }]
          }
        }
      }
    );

    // Update InstituteOwners without wallet
    const instituteOwnersUpdated = await InstituteOwner.updateMany(
      { 'wallet.coins': { $exists: false } },
      {
        $set: {
          wallet: {
            coins: 500,
            transactions: [{
              type: 'credit',
              amount: 500,
              description: 'Welcome bonus for existing user!',
              timestamp: new Date(),
            }]
          }
        }
      }
    );

    console.log(`Updated ${studentsUpdated.modifiedCount} students`);
    console.log(`Updated ${usersUpdated.modifiedCount} users`);
    console.log(`Updated ${instituteOwnersUpdated.modifiedCount} institute owners`);
    console.log('Migration completed successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addWalletToExistingUsers();
