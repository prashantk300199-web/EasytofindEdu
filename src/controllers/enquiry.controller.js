import * as enquiryService from "../services/enquiry.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

// ─── Student controllers ──────────────────────────────────────────────────────

// POST /api/v1/enquiries/batch/:batchId
export const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.createEnquiryService(
    req.student._id,
    req.params.batchId,
    req.body
  );
  return res.status(201).json(
    new ApiResponse(201, "Enquiry submitted successfully. The institute will contact you soon.", enquiry)
  );
});

// GET /api/v1/enquiries/my
export const getMyEnquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await enquiryService.getMyEnquiriesService(req.student._id, page, limit);
  return res.status(200).json(new ApiResponse(200, "Your enquiries fetched successfully.", result));
});

// DELETE /api/v1/enquiries/my/:enquiryId
export const deleteMyEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.deleteMyEnquiryService(
    req.params.enquiryId,
    req.student._id
  );
  return res.status(200).json(new ApiResponse(200, "Enquiry cancelled successfully.", enquiry));
});


// ─── Admin controllers ────────────────────────────────────────────────────────

// GET /api/v1/enquiries/admin?status=pending&institute=...&page=1&limit=10
export const adminGetAllEnquiries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, ...filters } = req.query;
  const result = await enquiryService.getAllEnquiriesService(filters, page, limit);
  return res.status(200).json(new ApiResponse(200, "Enquiries fetched successfully.", result));
});

// GET /api/v1/enquiries/admin/:id
export const adminGetEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.getEnquiryByIdService(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Enquiry fetched successfully.", enquiry));
});

// PUT /api/v1/enquiries/admin/:id/status
export const adminUpdateEnquiryStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const enquiry = await enquiryService.updateEnquiryStatusService(req.params.id, status, adminNote);
  return res.status(200).json(new ApiResponse(200, "Enquiry status updated successfully.", enquiry));
});

// DELETE /api/v1/enquiries/admin/:id
export const adminDeleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryService.deleteEnquiryService(req.params.id);
  return res.status(200).json(new ApiResponse(200, "Enquiry deleted successfully.", enquiry));
});