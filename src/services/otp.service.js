import crypto from "crypto";
import Otp from "../models/Otp.js";

const OTP_EXPIRY_MINUTES = 10;

export const generateOtp = async (email) => {
  await Otp.deleteMany({ email });

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const otp = await Otp.create({ email, code, expiresAt });
  return otp.code;
};

export const verifyOtp = async (email, code) => {
  const otp = await Otp.findOne({
    email,
    code,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) return false;

  otp.verified = true;
  await otp.save();
  return true;
};