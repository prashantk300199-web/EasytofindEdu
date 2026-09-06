import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import Students from '../models/Students.js';
import InstituteOwner from '../models/InstituteOwner.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { COOKIE_OPTIONS } from '../constants/api.constants.js';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper Functions ────────────────────────────────────────────────────────

// Generate unique referral code
function generateReferralCode(name, id) {
  const cleanName = name.replace(/\s+/g, '').toUpperCase().substring(0, 4);
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${cleanName}${randomStr}`;
}

// Find referrer across all user types
async function findReferrer(referralCode) {
  let referrer = await Students.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'student', model: Students };

  referrer = await User.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'owner', model: User };

  referrer = await InstituteOwner.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'institute_owner', model: InstituteOwner };

  return null;
}

// Process referral rewards for NEW users only
async function processReferralRewards(newUser, newUserModel, referralCode) {
  try {
    // Double-check: only process if rewards not already given
    if (newUser.referralRewardsGiven) {
      console.log('Referral rewards already given to user:', newUser.email);
      return;
    }

    let coinsForNewUser = 500; // Default welcome bonus
    let referrerData = null;

    // Validate referral code if provided
    if (referralCode && referralCode.trim()) {
      referrerData = await findReferrer(referralCode);

      if (referrerData) {
        coinsForNewUser = 1000; // Bonus with valid referral

        // Award 500 coins to referrer
        await referrerData.model.findByIdAndUpdate(referrerData.user._id, {
          $inc: { 'wallet.coins': 500 },
          $push: {
            'wallet.transactions': {
              type: 'credit',
              amount: 500,
              description: `Referral bonus! ${newUser.name} joined using your code`,
              timestamp: new Date(),
            }
          }
        });

        console.log(`✅ Referrer ${referrerData.user.email} received 500 coins`);
      } else {
        console.log('⚠️ Invalid referral code provided:', referralCode);
      }
    }

    // Award coins to new user
    const welcomeMessage = referrerData
      ? `Welcome bonus! Joined using referral code ${referralCode}`
      : 'Welcome bonus! Thanks for signing up with Google';

    await newUserModel.findByIdAndUpdate(newUser._id, {
      $set: {
        'wallet.coins': coinsForNewUser,
        'referralRewardsGiven': true
      },
      $push: {
        'wallet.transactions': {
          type: 'credit',
          amount: coinsForNewUser,
          description: welcomeMessage,
          timestamp: new Date(),
        }
      }
    });

    console.log(`✅ New user ${newUser.email} received ${coinsForNewUser} coins`);
  } catch (error) {
    console.error('Error processing referral rewards:', error);
  }
}

// Verify Google token
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    googleId: payload.sub,
  };
}

// ─── Main Google Login Handler ───────────────────────────────────────────────

/**
 * POST /api/v1/auth/google
 * Body: { idToken: string, role: 'student' | 'owner' | 'institute_owner', referralCode?: string }
 *
 * Handles Google OAuth login for all user types.
 * - First time login: Creates account, processes referral rewards, generates referral code
 * - Subsequent logins: Returns existing user data (NO duplicate rewards)
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, role, referralCode } = req.body;

  if (!idToken) throw new ApiError(400, 'Google ID token is required.');
  if (!['student', 'owner', 'institute_owner'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be student, owner, or institute_owner.');
  }

  // Verify Google token
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(idToken);
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new ApiError(401, 'Invalid or expired Google token.');
  }

  const { email, name, googleId } = googleUser;

  // ─── STUDENT ROLE ────────────────────────────────────────────────────────────
  if (role === 'student') {
    let student = await Students.findOne({ email });
    let isNewUser = false;

    if (!student) {
      // NEW USER - Create account
      isNewUser = true;

      student = await Students.create({
        name,
        email,
        phone: '',
        status: 'verified',
        googleId,
        authProvider: 'google',
        referredBy: referralCode || '',
        referralRewardsGiven: false, // Will be set to true after rewards
      });

      // Generate unique referral code for new student
      const newReferralCode = generateReferralCode(student.name, student._id);
      student.referralCode = newReferralCode;
      await student.save();

      // Process referral rewards
      await processReferralRewards(student, Students, referralCode);

      console.log(`✅ New student created: ${email} with referral code: ${newReferralCode}`);
    } else {
      // EXISTING USER - Just log them in (no rewards)
      console.log(`✅ Existing student login: ${email}`);
    }

    const token = jwt.sign({ id: student._id, role: 'student' }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn
    });

    res.cookie('studentToken', token, COOKIE_OPTIONS);

    return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
      token,
      user: student.toJSON(),
      role: 'student',
      isNewUser,
    }));
  }

  // ─── OWNER ROLE ──────────────────────────────────────────────────────────────
  if (role === 'owner') {
    let owner = await User.findOne({ email });
    let isNewUser = false;

    if (!owner) {
      // NEW USER - Create account
      isNewUser = true;

      owner = await User.create({
        name,
        email,
        phone: '',
        status: 'verified',
        googleId,
        authProvider: 'google',
        referredBy: referralCode || '',
        referralRewardsGiven: false,
      });

      // Generate referral code for owner
      const newReferralCode = generateReferralCode(owner.name, owner._id);
      owner.referralCode = newReferralCode;
      await owner.save();

      // Process referral rewards (owners also get rewards)
      await processReferralRewards(owner, User, referralCode);

      console.log(`✅ New owner created: ${email} with referral code: ${newReferralCode}`);
    } else {
      console.log(`✅ Existing owner login: ${email}`);
    }

    const token = jwt.sign({ id: owner._id, role: 'owner' }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
      token,
      user: owner.toJSON(),
      role: 'owner',
      isNewUser,
    }));
  }

  // ─── INSTITUTE OWNER ROLE ────────────────────────────────────────────────────
  if (role === 'institute_owner') {
    let owner = await InstituteOwner.findOne({ email });
    let isNewUser = false;

    if (!owner) {
      // NEW USER - Create account
      isNewUser = true;

      owner = await InstituteOwner.create({
        name,
        email,
        phone: '',
        status: 'verified',
        googleId,
        authProvider: 'google',
        referredBy: referralCode || '',
        referralRewardsGiven: false,
      });

      // Generate referral code for institute owner
      const newReferralCode = generateReferralCode(owner.name, owner._id);
      owner.referralCode = newReferralCode;
      await owner.save();

      // Process referral rewards
      await processReferralRewards(owner, InstituteOwner, referralCode);

      console.log(`✅ New institute owner created: ${email} with referral code: ${newReferralCode}`);
    } else {
      console.log(`✅ Existing institute owner login: ${email}`);
    }

    const token = jwt.sign({ id: owner._id, role: 'institute_owner' }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn
    });

    res.cookie('instituteOwnerToken', token, COOKIE_OPTIONS);

    return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
      token,
      user: owner.toJSON(),
      role: 'institute_owner',
      isNewUser,
    }));
  }
});
