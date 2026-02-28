import jwt from "jsonwebtoken";
import Student from "../models/Students.js";
import { generateOtp, verifyOtp } from "../services/otp.service.js";
import { sendOtpEmail } from "../services/email.service.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

// ─── Token ───────────────────────────────────────────────────────────────────
const generateToken = (student) =>
  jwt.sign({ id: student._id, role: "student" }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

// ─── Register ────────────────────────────────────────────────────────────────
export const registerStudent = async (name, email, phone, password, gender, lastQualification) => {
  const existing = await Student.findOne({ email });

  if (existing && existing.status !== "pending") {
    throw new ApiError(409, "Email is already registered.");
  }

  if (existing && existing.status === "pending") {
    // Allow re-registration while still pending (resend OTP flow)
    existing.name = name;
    existing.phone = phone;
    existing.password = password;   // pre-save hook will re-hash
    existing.gender = gender || "";
    existing.lastQualification = lastQualification || "";
    await existing.save();
  } else {
    await Student.create({ name, email, phone, password, gender, lastQualification });
  }

  const otp = await generateOtp(email);
  await sendOtpEmail(email, otp);

  return { message: "Registration successful. OTP sent to your email." };
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyStudentOtp = async (email, otpCode) => {
  const isValid = await verifyOtp(email, otpCode);
  if (!isValid) throw new ApiError(400, "Invalid or expired OTP.");

  const student = await Student.findOne({ email });
  if (!student) throw new ApiError(404, "Student not found.");

  student.status = "verified";
  await student.save();

  const token = generateToken(student);
  return { token, student: student.toJSON() };
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
  return student;
};

export const blockStudent = async (id) => {
  const student = await Student.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
  if (!student) throw new ApiError(404, "Student not found.");
  return student;
};