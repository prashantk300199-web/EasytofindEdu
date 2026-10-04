import * as svc from '../services/collegeApplication.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

const ok = (res, msg, data, status = 200) =>
  res.status(status).json(new ApiResponse(status, msg, data));

const fail = (res, error) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
  }
  console.error(error);
  return res.status(500).json(new ApiResponse(500, 'Internal server error'));
};

export const getCollegeApplications = async (req, res) => {
  try {
    const result = await svc.getCollegeApplicationsService(req.query);
    return ok(res, 'College applications fetched successfully', result);
  } catch (e) { return fail(res, e); }
};

export const getCollegeApplicationById = async (req, res) => {
  try {
    const application = await svc.getCollegeApplicationByIdService(req.params.id);
    return ok(res, 'College application fetched successfully', application);
  } catch (e) { return fail(res, e); }
};

export const approveApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const application = await svc.approveApplicationService(req.params.id, adminId, adminName);
    return ok(res, 'College application approved successfully', application);
  } catch (e) { return fail(res, e); }
};

export const requestChanges = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { feedback } = req.body;
    if (!feedback) throw new ApiError(400, 'Feedback is required');
    const application = await svc.requestChangesService(req.params.id, adminId, adminName, feedback);
    return ok(res, 'Changes requested successfully', application);
  } catch (e) { return fail(res, e); }
};

export const rejectApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, 'Rejection reason is required');
    const application = await svc.rejectApplicationService(req.params.id, adminId, adminName, reason);
    return ok(res, 'College application rejected successfully', application);
  } catch (e) { return fail(res, e); }
};

export const suspendApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, 'Suspension reason is required');
    const application = await svc.suspendApplicationService(req.params.id, adminId, adminName, reason);
    return ok(res, 'College suspended successfully', application);
  } catch (e) { return fail(res, e); }
};

export const getVerificationHistory = async (req, res) => {
  try {
    const history = await svc.getVerificationHistoryService(req.params.id);
    return ok(res, 'Verification history fetched successfully', history);
  } catch (e) { return fail(res, e); }
};

export const getApplicationStats = async (req, res) => {
  try {
    const stats = await svc.getApplicationStatsService();
    return ok(res, 'Application statistics fetched successfully', stats);
  } catch (e) { return fail(res, e); }
};