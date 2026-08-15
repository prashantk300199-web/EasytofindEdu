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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

/**
 * POST /api/v1/auth/google
 * Body: { idToken: string, role: 'student' | 'owner' | 'institute_owner' }
 *
 * Finds or creates the user for the given role, then returns a JWT cookie.
 * No OTP step is needed — Google already verified the email.
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, role } = req.body;

  if (!idToken) throw new ApiError(400, 'Google ID token is required.');
  if (!['student', 'owner', 'institute_owner'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be student, owner, or institute_owner.');
  }

  let googleUser;
  try {
    googleUser = await verifyGoogleToken(idToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired Google token.');
  }

  const { email, name, googleId } = googleUser;

  if (role === 'student') {
    let student = await Students.findOne({ email });
    if (!student) {
      student = await Students.create({
        name,
        email,
        phone: '',
        password: googleId,          // placeholder — Google users never use password login
        status: 'verified',
        googleId,
        authProvider: 'google',
      });
    }
    const token = jwt.sign({ id: student._id, role: 'student' }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    res.cookie('studentToken', token, COOKIE_OPTIONS);
    return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
      token,
      user: { _id: student._id, name: student.name, email: student.email },
      role: 'student',
    }));
  }

  if (role === 'owner') {
    let owner = await User.findOne({ email });
    if (!owner) {
      owner = await User.create({
        name,
        email,
        phone: '',
        password: googleId,
        status: 'verified',
        googleId,
        authProvider: 'google',
      });
    }
    const token = jwt.sign({ id: owner._id, role: 'owner' }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
      token,
      user: { _id: owner._id, name: owner.name, email: owner.email },
      role: 'owner',
    }));
  }

  // institute_owner
  let owner = await InstituteOwner.findOne({ email });
  if (!owner) {
    owner = await InstituteOwner.create({
      name,
      email,
      phone: '',
      password: googleId,
      status: 'verified',
      googleId,
      authProvider: 'google',
    });
  }
  const token = jwt.sign({ id: owner._id, role: 'institute_owner' }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  res.cookie('instituteOwnerToken', token, COOKIE_OPTIONS);
  return res.status(200).json(new ApiResponse(200, 'Google login successful.', {
    token,
    user: { _id: owner._id, name: owner.name, email: owner.email },
    role: 'institute_owner',
  }));
});
