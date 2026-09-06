import Students from "../models/Students.js";
import User from "../models/User.js";
import InstituteOwner from "../models/InstituteOwner.js";
import crypto from "crypto";

// Generate unique referral code
function generateReferralCode(name, id) {
  const cleanName = name.replace(/\s+/g, '').toUpperCase().substring(0, 4);
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${cleanName}${randomStr}`;
}

// Get user model based on role
function getUserModel(role) {
  if (role === 'student') return Students;
  if (role === 'owner') return User;
  if (role === 'institute_owner') return InstituteOwner;
  throw new Error('Invalid role');
}

// Process referral rewards
export async function processReferral(newUserId, referralCode, role) {
  try {
    if (!referralCode) return;

    const UserModel = getUserModel(role);

    // Find the referrer by referral code (check all user types)
    let referrer = await Students.findOne({ referralCode });
    let referrerRole = 'student';

    if (!referrer) {
      referrer = await User.findOne({ referralCode });
      referrerRole = 'owner';
    }

    if (!referrer) {
      referrer = await InstituteOwner.findOne({ referralCode });
      referrerRole = 'institute_owner';
    }

    if (!referrer) {
      console.log('Invalid referral code:', referralCode);
      return;
    }

    // Award 1000 coins to new user
    await UserModel.findByIdAndUpdate(newUserId, {
      $inc: { 'wallet.coins': 1000 },
      $push: {
        'wallet.transactions': {
          type: 'credit',
          amount: 1000,
          description: `Referral bonus for joining with code ${referralCode}`,
          timestamp: new Date(),
        }
      },
      referredBy: referralCode,
    });

    // Award 500 coins to referrer
    const ReferrerModel = getUserModel(referrerRole);
    await ReferrerModel.findByIdAndUpdate(referrer._id, {
      $inc: { 'wallet.coins': 500 },
      $push: {
        'wallet.transactions': {
          type: 'credit',
          amount: 500,
          description: `Referral bonus for referring a new user`,
          timestamp: new Date(),
        }
      }
    });

    console.log(`Referral processed: ${referralCode} - New user got 1000, Referrer got 500`);
  } catch (error) {
    console.error('Error processing referral:', error);
  }
}

// Get or create referral code for user
export async function getReferralCode(req, res) {
  try {
    // Support both req.user and req.student (from different middleware)
    const user = req.student || req.user;
    const userId = user._id;
    const role = user.role || 'student';
    const UserModel = getUserModel(role);

    let userData = await UserModel.findById(userId);

    if (!userData.referralCode) {
      // Generate new referral code
      const referralCode = generateReferralCode(userData.name, userData._id);
      userData.referralCode = referralCode;
      await userData.save();
    }

    res.status(200).json({
      success: true,
      data: {
        referralCode: userData.referralCode,
        coins: userData.wallet?.coins || 0,
      }
    });
  } catch (error) {
    console.error('Referral code error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get wallet details
export async function getWallet(req, res) {
  try {
    // Support both req.user and req.student (from different middleware)
    const user = req.student || req.user;
    const userId = user._id;
    const role = user.role || 'student';
    const UserModel = getUserModel(role);

    let userData = await UserModel.findById(userId).select('name wallet referralCode');

    // Generate referral code if it doesn't exist
    if (!userData.referralCode) {
      const referralCode = generateReferralCode(userData.name, userData._id);
      userData.referralCode = referralCode;
      await userData.save();
    }

    res.status(200).json({
      success: true,
      data: {
        coins: userData.wallet?.coins || 0,
        transactions: userData.wallet?.transactions || [],
        referralCode: userData.referralCode || '',
      }
    });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Admin: Update user coins
export async function updateUserCoins(req, res) {
  try {
    const { userId, role, amount, description, type } = req.body;

    if (!userId || !role || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: 'userId, role, amount, and type are required',
      });
    }

    const UserModel = getUserModel(role);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updateAmount = type === 'credit' ? amount : -amount;

    await UserModel.findByIdAndUpdate(userId, {
      $inc: { 'wallet.coins': updateAmount },
      $push: {
        'wallet.transactions': {
          type,
          amount,
          description: description || `Admin ${type} by admin`,
          timestamp: new Date(),
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${type}ed ${amount} coins`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Admin: Get user wallet
export async function adminGetUserWallet(req, res) {
  try {
    const { userId, role } = req.params;

    const UserModel = getUserModel(role);
    const user = await UserModel.findById(userId).select('name email wallet referralCode');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        coins: user.wallet?.coins || 0,
        transactions: user.wallet?.transactions || [],
        referralCode: user.referralCode || '',
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
