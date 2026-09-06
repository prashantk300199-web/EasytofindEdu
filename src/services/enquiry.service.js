import Student from "../models/Students.js";        // ← ADD THIS
import Enquiry from "../models/Enquiry.js";
import Batch from "../models/Batch.js";
import Institute from "../models/Institute.js";
import InstituteOwner from "../models/InstituteOwner.js";
import ApiError from "../utils/ApiError.js";
import {
  sendEnquiryEmailToOwner,
  sendEnquiryConfirmationToStudent,
} from "./email.service.js";

// ─── Student submits enquiry ──────────────────────────────────────────────────
export const createEnquiryService = async (studentId, batchId, data) => {
  // 1. Fetch batch with institute + course populated
  const batch = await Batch.findById(batchId)
    .populate("institute")
    .populate("course");

  if (!batch) throw new ApiError(404, "Batch not found.");
  if (!batch.isActive) throw new ApiError(400, "This batch is no longer active.");
  if (batch.seatsAvailable <= 0) throw new ApiError(400, "No seats available in this batch.");

  const institute = batch.institute;
  const course = batch.course;

  // 2. Check for duplicate enquiry
  const alreadyEnquired = await Enquiry.findOne({ student: studentId, batch: batchId });
  if (alreadyEnquired) {
    throw new ApiError(409, "You have already submitted an enquiry for this batch.");
  }

  // 3. Get student info for snapshot
  const Student = (await import("../models/Students.js")).default;
  const student = await Student.findById(studentId);
  if (!student) throw new ApiError(404, "Student not found.");

  // 4. Create enquiry with student snapshot
  const enquiry = await Enquiry.create({
    student: studentId,
    batch: batchId,
    institute: institute._id,
    course: course._id,
    message: data.message || "",
    preferredContactTime: data.preferredContactTime || "Any Time",
    willingToVisit: data.willingToVisit || false,
    expectedJoiningDate: data.expectedJoiningDate || "Just Exploring",
    studentSnapshot: {
      name:  student.name,
      email: student.email,
      phone: student.phone,
    },
  });

  // 5. Find institute owner's email
  const owner = await InstituteOwner.findById(institute.createdBy);

  // 6. Send emails (non-blocking — don't fail enquiry if email fails)
  try {
    if (owner?.email) {
      await sendEnquiryEmailToOwner({
        ownerEmail: owner.email,
        ownerName:  owner.name,
        enquiry,
        batch,
        course,
        institute,
      });
      // Mark email sent
      enquiry.emailSentToOwner = true;
      await enquiry.save();
    }

    await sendEnquiryConfirmationToStudent({
      studentEmail: student.email,
      studentName:  student.name,
      batch,
      course,
      institute,
    });
  } catch (emailError) {
    // Log but don't throw — enquiry is already saved
    console.error("📍 Email sending failed:", emailError.message);
  }

  return enquiry;
};


// ─── Student views their own enquiries ───────────────────────────────────────
export const getMyEnquiriesService = async (studentId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Enquiry.find({ student: studentId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: "batch",      select: "batchName timing mode duration seatsAvailable" })
      .populate({ path: "institute",  select: "name logo location" })
      .populate({ path: "course",     select: "name description" }),
    Enquiry.countDocuments({ student: studentId }),
  ]);

  return {
    data,
    pagination: {
      page:  parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};


// ─── Student cancels / deletes their enquiry ─────────────────────────────────
export const deleteMyEnquiryService = async (enquiryId, studentId) => {
  const enquiry = await Enquiry.findOne({ _id: enquiryId, student: studentId });
  if (!enquiry) throw new ApiError(404, "Enquiry not found or not yours to delete.");
  if (enquiry.status === "enrolled") throw new ApiError(400, "Cannot cancel an already enrolled enquiry.");

  await enquiry.deleteOne();
  return enquiry;
};


// ─── Admin: all enquiries ─────────────────────────────────────────────────────
export const getAllEnquiriesService = async (filters = {}, page = 1, limit = 10) => {
  const query = {};

  if (filters.status)    query.status    = filters.status;
  if (filters.institute) query.institute = filters.institute;
  if (filters.batch)     query.batch     = filters.batch;
  if (filters.course)    query.course    = filters.course;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: "student",   select: "name email phone" })
      .populate({ path: "batch",     select: "batchName timing mode duration" })
      .populate({ path: "institute", select: "name logo" })
      .populate({ path: "course",    select: "name" }),
    Enquiry.countDocuments(query),
  ]);

  return {
    data,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  };
};


// ─── Admin: get single enquiry ────────────────────────────────────────────────
export const getEnquiryByIdService = async (id) => {
  const enquiry = await Enquiry.findById(id)
    .populate({ path: "student",   select: "name email phone gender lastQualification" })
    .populate({ path: "batch",     select: "batchName timing mode duration totalSeats seatsAvailable startDate" })
    .populate({ path: "institute", select: "name logo location" })
    .populate({ path: "course",    select: "name description" });

  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  return enquiry;
};


// ─── Admin: update enquiry status / note ─────────────────────────────────────
export const updateEnquiryStatusService = async (id, status, adminNote) => {
  const allowed = ["pending", "contacted", "enrolled", "closed"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid status value.");

  const enquiry = await Enquiry.findByIdAndUpdate(
    id,
    { status, ...(adminNote !== undefined && { adminNote }) },
    { new: true }
  );
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  return enquiry;
};


// ─── Admin: delete enquiry ────────────────────────────────────────────────────
export const deleteEnquiryService = async (id) => {
  const enquiry = await Enquiry.findByIdAndDelete(id);
  if (!enquiry) throw new ApiError(404, "Enquiry not found.");
  return enquiry;
};