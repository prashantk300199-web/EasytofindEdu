import Admission from "../models/Admission.js";
import HostelInquiry from "../models/HostelInquiry.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const applyForAdmission = asyncHandler(async (req, res) => {
  const { instituteId, course, studentDetails, message } = req.body;

  if (!instituteId || !course || !studentDetails) {
    throw new ApiError(400, "All fields are required.");
  }

  const admission = await Admission.create({
    student: req.student._id,
    institute: instituteId,
    course,
    studentDetails,
    message
  });

  return res.status(201).json(new ApiResponse(201, "Application submitted successfully!", admission));
});

export const getStudentAdmissions = asyncHandler(async (req, res) => {
  const admissions = await Admission.find({ student: req.student._id })
    .populate("institute", "name profilePhoto address")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, "Admissions fetched successfully.", admissions));
});

export const adminGetAllAdmissions = asyncHandler(async (req, res) => {
  const admissions = await Admission.find()
    .populate("student", "name email phone")
    .populate("institute", "name")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, "All admissions fetched successfully.", admissions));
});

export const updateAdmissionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const admission = await Admission.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!admission) throw new ApiError(404, "Admission record not found.");

  return res.status(200).json(new ApiResponse(200, "Status updated successfully.", admission));
});

export const getStudentHostelInquiries = asyncHandler(async (req, res) => {
  const inquiries = await HostelInquiry.find({ student: req.student._id })
    .populate("hostel", "name photos address slug")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, "Hostel inquiries fetched successfully.", inquiries));
});
