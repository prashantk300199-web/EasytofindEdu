import { Router } from "express";
import { register, verifyOtpController, login, resendOtp, logout } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.js";
import { registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema } from "../validators/auth.validator.js";
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import Students from '../models/Students.js';
import User from '../models/User.js';
import InstituteOwner from '../models/InstituteOwner.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { COOKIE_OPTIONS } from '../constants/api.constants.js';
import crypto from 'crypto';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/register", validate(registerSchema), register);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtpController);
router.post("/login", validate(loginSchema), login);
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);
router.post("/logout", logout);

// Google Login Route - inline to avoid import issues
router.post("/google", async (req, res, next) => {
  try {
    const { idToken, role, referralCode } = req.body;

    if (!idToken || !role) {
      throw new ApiError(400, 'idToken and role are required');
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Determine model based on role
    let Model, modelName;
    if (role === 'student') {
      Model = Students;
      modelName = 'Students';
    } else if (role === 'owner') {
      Model = User;
      modelName = 'User';
    } else if (role === 'institute_owner') {
      Model = InstituteOwner;
      modelName = 'InstituteOwner';
    } else {
      throw new ApiError(400, 'Invalid role');
    }

    // Check if user exists
    let user = await Model.findOne({ email });

    if (!user) {
      // Create new user
      const generatedReferralCode = name.replace(/\s+/g, '').toUpperCase().substring(0, 4) + crypto.randomBytes(3).toString('hex').toUpperCase();

      const userData = {
        name,
        email,
        profilePicture: picture || '',
        isVerified: true,
        referralCode: generatedReferralCode,
        wallet: {
          coins: referralCode ? 1000 : 500,
          transactions: [{
            type: 'credit',
            amount: referralCode ? 1000 : 500,
            description: referralCode ? `Welcome bonus! Joined using referral code ${referralCode}` : 'Welcome bonus for new user!',
            timestamp: new Date(),
          }]
        }
      };

      // For User and InstituteOwner models, password is required, so generate a random one
      if (role === 'owner' || role === 'institute_owner') {
        userData.password = crypto.randomBytes(32).toString('hex');
      }

      user = await Model.create(userData);

      // Process referral rewards if referral code provided
      if (referralCode) {
        try {
          let referrer = await Students.findOne({ referralCode });
          let ReferrerModel = Students;

          if (!referrer) {
            referrer = await User.findOne({ referralCode });
            ReferrerModel = User;
          }

          if (!referrer) {
            referrer = await InstituteOwner.findOne({ referralCode });
            ReferrerModel = InstituteOwner;
          }

          if (referrer) {
            await ReferrerModel.findByIdAndUpdate(referrer._id, {
              $inc: { 'wallet.coins': 500 },
              $push: {
                'wallet.transactions': {
                  type: 'credit',
                  amount: 500,
                  description: 'Referral bonus! Someone joined using your code',
                  timestamp: new Date(),
                }
              }
            });
          }
        } catch (error) {
          console.error('Error processing referral:', error);
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json(
      new ApiResponse(200, 'Login successful', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role,
          profilePicture: user.profilePicture,
          referralCode: user.referralCode,
          wallet: user.wallet,
        },
      })
    );
  } catch (error) {
    next(error);
  }
});

export default router;