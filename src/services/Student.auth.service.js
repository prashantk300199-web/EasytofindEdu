import jwt from "jsonwebtoken";
import crypto from "crypto";
import Student from "../models/Students.js";
import User from "../models/User.js";
import InstituteOwner from "../models/InstituteOwner.js";
import { generateOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

// ─── Token ───────────────────────────────────────────────────────────────────
const generateToken = (student) =>
  jwt.sign({ id: student._id, role: "student" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

// ─── Helper: Generate unique referral code ──────────────────────────────────
function generateReferralCode(name, id) {
  const cleanName = name.replace(/\s+/g, '').toUpperCase().substring(0, 4);
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${cleanName}${randomStr}`;
}

// ─── Helper: Find referrer across all user types ───────────────────────────
async function findReferrer(referralCode) {
  let referrer = await Student.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'student', model: Student };

  referrer = await User.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'owner', model: User };

  referrer = await InstituteOwner.findOne({ referralCode });
  if (referrer) return { user: referrer, role: 'institute_owner', model: InstituteOwner };

  return null;
}

// ─── Helper: Process referral rewards (ONLY for new verified users) ────────
async function processReferralRewards(student) {
  // Safety check: only process if rewards not already given
  if (student.referralRewardsGiven) {
    console.log('⚠️ Referral rewards already given to:', student.email);
    return;
  }

  let coinsForNewUser = 500; // Default welcome bonus
  let referrerData = null;

  // Check if student used a referral code
  if (student.referredBy && student.referredBy.trim()) {
    referrerData = await findReferrer(student.referredBy);

    if (referrerData) {
      coinsForNewUser = 1000; // Bonus with valid referral

      // Award 500 coins to referrer
      await referrerData.model.findByIdAndUpdate(referrerData.user._id, {
        $inc: { 'wallet.coins': 500 },
        $push: {
          'wallet.transactions': {
            type: 'credit',
            amount: 500,
            description: `Referral bonus! ${student.name} joined using your code`,
            timestamp: new Date(),
          }
        }
      });

      console.log(`✅ Referrer ${referrerData.user.email} received 500 coins`);
    } else {
      console.log('⚠️ Invalid referral code:', student.referredBy);
    }
  }

  // Award coins to new student
  const welcomeMessage = referrerData
    ? `Welcome bonus! Joined using referral code ${student.referredBy}`
    : 'Welcome bonus! Thanks for joining EasyToFindEdu';

  await Student.findByIdAndUpdate(student._id, {
    $inc: { 'wallet.coins': coinsForNewUser },
    $set: { 'referralRewardsGiven': true },
    $push: {
      'wallet.transactions': {
        type: 'credit',
        amount: coinsForNewUser,
        description: welcomeMessage,
        timestamp: new Date(),
      }
    }
  });

  console.log(`✅ New student ${student.email} received ${coinsForNewUser} coins`);
}

// ─── Register ────────────────────────────────────────────────────────────────
export const registerStudent = async (name, email, phone, password, gender, lastQualification, referralCode) => {
  const existing = await Student.findOne({ email });

  if (existing && existing.status !== "pending") {
    throw new ApiError(409, "Email is already registered.");
  }

  let student;
  if (existing && existing.status === "pending") {
    // Allow re-registration while still pending (resend OTP flow)
    existing.name = name;
    existing.phone = phone;
    existing.password = password;   // pre-save hook will re-hash
    existing.gender = gender || "";
    existing.lastQualification = lastQualification || "";
    if (referralCode) existing.referredBy = referralCode;
    await existing.save();
    student = existing;
  } else {
    // Create new pending student
    student = await Student.create({
      name,
      email,
      phone,
      password,
      gender,
      lastQualification,
      referredBy: referralCode || '',
      referralRewardsGiven: false, // Will be set to true after OTP verification
    });
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  console.log(`📧 OTP sent to ${email} for registration`);
  return { message: "Registration successful. OTP sent to your email." };
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyStudentOtp = async (email, otpCode) => {
  const isValid = await verifyOtp(email, otpCode);
  if (!isValid) throw new ApiError(400, "Invalid or expired OTP.");

  const student = await Student.findOne({ email });
  if (!student) throw new ApiError(404, "Student not found.");

  // If already verified, just return token (prevent duplicate processing)
  if (student.status === "verified") {
    console.log(`✅ Student already verified: ${email}`);
    const token = generateToken(student);
    return { token, student: student.toJSON() };
  }

  // Mark as verified
  student.status = "verified";

  // Generate unique referral code for the new student
  const referralCode = generateReferralCode(student.name, student._id);
  student.referralCode = referralCode;

  await student.save();

  console.log(`✅ Student verified: ${email} with referral code: ${referralCode}`);

  // Process referral rewards (only if not already given)
  await processReferralRewards(student);

  const token = generateToken(student);

  // Fetch updated student with new coin balance
  const updatedStudent = await Student.findById(student._id);

  return { token, student: updatedStudent.toJSON() };
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginStudent = async (email, password) => {
  const student = await Student.findOne({ email }).select("+password");
  if (!student) throw new ApiError(401, "Invalid email or password.");

  if (student.status === "pending")
    throw new ApiError(403, "Please verify your email first.");

  if (student.status === "blocked")
    throw new ApiError(403, "Your account has been blocked.");

  const isMatch = await student.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password.");

  console.log(`✅ Student logged in: ${email}`);

  const token = generateToken(student);
  return { token, student: student.toJSON() };
};

// ─── Resend OTP ──────────────────────────────────────────────────────────────
export const resendStudentOtp = async (email) => {
  const student = await Student.findOne({ email });
  if (!student) throw new ApiError(404, "No account found with this email.");
  if (student.status === "verified") throw new ApiError(400, "Email is already verified.");

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  console.log(`📧 OTP resent to ${email}`);
  return { message: "OTP resent to your email." };
};

// ─── Get profile ─────────────────────────────────────────────────────────────
export const getStudentProfile = async (id) => {
  const student = await Student.findById(id).populate("enrolledBatches");
  if (!student) throw new ApiError(404, "Student not found.");
  return student;
};

// ─── Update profile (text fields) ────────────────────────────────────────────
export const updateStudentProfile = async (id, data) => {
  // Prevent status / password change through this route
  delete data.password;
  delete data.status;
  delete data.email;       // email change needs its own verified flow
  delete data.wallet;      // prevent direct wallet manipulation
  delete data.referralCode; // prevent referral code changes
  delete data.referralRewardsGiven; // prevent reward flag manipulation

  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!student) throw new ApiError(404, "Student not found.");
  return student;
};

// ─── Update profile photo ─────────────────────────────────────────────────────
export const updateStudentPhoto = async (id, file) => {
  if (!file) throw new ApiError(400, "No image file provided.");

  const profilePhoto = {
    url: file.path,           // Cloudinary URL
    publicId: file.filename,  // Cloudinary public_id
  };

  const student = await Student.findByIdAndUpdate(
    id,
    { profilePhoto },
    { new: true }
  );
  if (!student) throw new ApiError(404, "Student not found.");
  return student;
};

// ─── Change password ─────────────────────────────────────────────────────────
export const changeStudentPassword = async (id, currentPassword, newPassword) => {
  const student = await Student.findById(id).select("+password");
  if (!student) throw new ApiError(404, "Student not found.");

  const isMatch = await student.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, "Current password is incorrect.");

  student.password = newPassword;   // pre-save hook hashes it
  await student.save();

  console.log(`✅ Password changed for student: ${student.email}`);
  return { message: "Password changed successfully." };
};

// ─── Admin helpers ───────────────────────────────────────────────────────────
export const getAllStudents = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Student.find().skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    Student.countDocuments(),
  ]);
  return {
    data,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };
};

export const getStudentById = async (id) => {
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found.");
  return student;
};

export const deleteStudent = async (id) => {
  const student = await Student.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, "Student not found.");
  console.log(`🗑️ Admin deleted student: ${student.email}`);
  return student;
};

export const blockStudent = async (id) => {
  const student = await Student.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
  if (!student) throw new ApiError(404, "Student not found.");
  console.log(`🚫 Admin blocked student: ${student.email}`);
  return student;
};

export const unblockStudent = async (id) => {
  const student = await Student.findByIdAndUpdate(id, { status: "verified" }, { new: true });
  if (!student) throw new ApiError(404, "Student not found.");
  console.log(`✅ Admin unblocked student: ${student.email}`);
  return student;
};

export const adminUpdateStudentService = async (id, data) => {
  // Prevent direct password change for security/flow reasons
  delete data.password;

  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!student) throw new ApiError(404, "Student not found.");
  console.log(`✏️ Admin updated student: ${student.email}`);
  return student;
};

// ─── Admin Coin Management ──────────────────────────────────────────────────

export const adminUpdateStudentCoins = async (id, coins) => {
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found.");

  const oldCoins = student.wallet?.coins || 0;
  const difference = coins - oldCoins;

  await Student.findByIdAndUpdate(id, {
    $set: { 'wallet.coins': coins },
    $push: {
      'wallet.transactions': {
        type: difference >= 0 ? 'credit' : 'debit',
        amount: Math.abs(difference),
        description: `Admin adjustment: ${difference >= 0 ? 'added' : 'deducted'} ${Math.abs(difference)} coins`,
        timestamp: new Date(),
      }
    }
  });

  const updatedStudent = await Student.findById(id);
  console.log(`💰 Admin updated coins for ${student.email}: ${oldCoins} → ${coins}`);
  return updatedStudent;
};

// ─── Wishlist ──────────────────────────────────────────────────────────────────

export const toggleHostelWishlist = async (studentId, hostelId) => {
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, "Student not found.");

  const index = student.wishlist.indexOf(hostelId);
  let message = "";

  if (index === -1) {
    student.wishlist.push(hostelId);
    message = "Hostel added to wishlist.";
  } else {
    student.wishlist.splice(index, 1);
    message = "Hostel removed from wishlist.";
  }

  // Save with validateBeforeSave: false to avoid validating populated hostel documents
  await student.save({ validateBeforeSave: false });
  return { message, wishlist: student.wishlist };
};

export const getStudentWishlist = async (studentId) => {
  const student = await Student.findById(studentId).populate({
    path: 'wishlist',
    select: 'name slug photos address hostel_type'
  });
  if (!student) throw new ApiError(404, "Student not found.");
  return student.wishlist;
};

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export const getWishlistAnalytics = async () => {
  // Find all students who have items in their wishlist
  const students = await Student.find({ "wishlist.0": { $exists: true } })
    .populate("wishlist", "name slug address photos hostel_type")
    .select("name email phone wishlist");

  // Aggregate by hostel to see "most popular"
  const hostelMap = {};

  students.forEach(student => {
    student.wishlist.forEach(hostel => {
      const hId = hostel._id.toString();
      if (!hostelMap[hId]) {
        hostelMap[hId] = {
          hostel,
          interestedStudents: []
        };
      }
      hostelMap[hId].interestedStudents.push({
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone
      });
    });
  });

  return Object.values(hostelMap);
};
