import * as svc from '../services/instituteApplication.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

// Helper functions
const ok = (res, msg, data, status = 200) =>
  res.status(status).json(new ApiResponse(status, msg, data));

const fail = (res, error) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message));
  }
  console.error(error);
  return res.status(500).json(new ApiResponse(500, 'Internal server error'));
};

/**
 * Get all institute applications with filters
 * GET /api/admin/institute-applications
 */
export const getInstituteApplications = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      category: req.query.category,
      state: req.query.state,
      city: req.query.city
    };

    const result = await svc.getInstituteApplicationsService(filters);
    return ok(res, 'Institute applications fetched successfully', result);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Get institute application by ID
 * GET /api/admin/institute-applications/:id
 */
export const getInstituteApplicationById = async (req, res) => {
  try {
    const application = await svc.getInstituteApplicationByIdService(req.params.id);
    return ok(res, 'Institute application fetched successfully', application);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Approve institute application
 * PATCH /api/admin/institute-applications/:id/approve
 */
export const approveApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;

    const application = await svc.approveApplicationService(req.params.id, adminId, adminName);
    return ok(res, 'Institute application approved successfully', application);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Request changes to institute application
 * PATCH /api/admin/institute-applications/:id/request-changes
 */
export const requestChanges = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { feedback } = req.body;

    if (!feedback) {
      throw new ApiError(400, 'Feedback is required');
    }

    const application = await svc.requestChangesService(req.params.id, adminId, adminName, feedback);
    return ok(res, 'Changes requested successfully', application);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Reject institute application
 * PATCH /api/admin/institute-applications/:id/reject
 */
export const rejectApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Rejection reason is required');
    }

    const application = await svc.rejectApplicationService(req.params.id, adminId, adminName, reason);
    return ok(res, 'Institute application rejected successfully', application);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Suspend verified institute
 * PATCH /api/admin/institute-applications/:id/suspend
 */
export const suspendApplication = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const adminName = req.admin.name;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Suspension reason is required');
    }

    const application = await svc.suspendApplicationService(req.params.id, adminId, adminName, reason);
    return ok(res, 'Institute suspended successfully', application);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Get verification history
 * GET /api/admin/institute-applications/:id/history
 */
export const getVerificationHistory = async (req, res) => {
  try {
    const history = await svc.getVerificationHistoryService(req.params.id);
    return ok(res, 'Verification history fetched successfully', history);
  } catch (error) {
    return fail(res, error);
  }
};

/**
 * Get application statistics
 * GET /api/admin/institute-applications/stats
 */
export const getApplicationStats = async (req, res) => {
  try {
    const stats = await svc.getApplicationStatsService();
    return ok(res, 'Application statistics fetched successfully', stats);
  } catch (error) {
    return fail(res, error);
  }
};
