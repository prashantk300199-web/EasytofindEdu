import CollegeDraft from '../models/CollegeDraft.js';
import CollegeProfile from '../models/college.model.js';
import ApiError from '../utils/ApiError.js';
import { buildCollegeUpdateFromDraft } from '../utils/collegeTransform.js';

/**
 * List college applications for the admin dashboard.
 */
export const getCollegeApplicationsService = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
  } = filters;

  const query = {};

  if (search) {
    query.$or = [
      { 'step1BasicInfo.collegeName': { $regex: search, $options: 'i' } },
      { 'step2Location.city': { $regex: search, $options: 'i' } },
      { 'step2Location.state': { $regex: search, $options: 'i' } },
    ];
  }

  if (status) query.verificationStatus = status;

  const skip = (page - 1) * limit;

  const applications = await CollegeDraft.find(query)
    .populate('owner', 'name email phone')
    .populate('verifiedBy', 'name email')
    .sort({ submittedAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await CollegeDraft.countDocuments(query);

  return {
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCollegeApplicationByIdService = async (id) => {
  const application = await CollegeDraft.findById(id)
    .populate('owner', 'name email phone')
    .populate('verifiedBy', 'name email')
    .populate('verificationHistory.admin', 'name email')
    .lean();

  if (!application) {
    throw new ApiError(404, 'College application not found');
  }
  return application;
};

/**
 * Approve — same approve-with-revert pattern as instituteApplication.service.js
 * so the admin gets the real Mongoose error instead of a generic 500, and the
 * draft is never stuck in 'verified' with no public CollegeProfile.
 */
export const approveApplicationService = async (id, adminId, adminName) => {
  const draft = await CollegeDraft.findById(id);

  if (!draft) throw new ApiError(404, 'College application not found');
  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Application is already verified');
  }
  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Cannot approve a rejected application');
  }

  if (!draft.step1BasicInfo?.collegeName) {
    throw new ApiError(400, 'College name is required');
  }

  draft.verificationStatus = 'verified';
  draft.verifiedAt = new Date();
  draft.verifiedBy = adminId;

  draft.verificationHistory.push({
    action: 'approved',
    status: 'verified',
    admin: adminId,
    adminName,
    timestamp: new Date(),
  });

  await draft.save();

  const update = buildCollegeUpdateFromDraft(draft);

  try {
    await CollegeProfile.findOneAndUpdate(
      { createdBy: draft.owner },
      update,
      { upsert: true, new: true, runValidators: true },
    );
  } catch (err) {
    // Revert so admin can retry
    draft.verificationStatus = 'submitted';
    draft.verifiedAt = undefined;
    draft.verifiedBy = undefined;
    draft.verificationHistory.pop();
    await draft.save().catch(() => {});

    const detail = (err && (err.message || err.toString())) || 'Unknown error';
    throw new ApiError(
      400,
      `College record could not be created: ${detail}. The application has been reset to "submitted" — please review the draft data and try again.`,
    );
  }

  return draft;
};

export const requestChangesService = async (id, adminId, adminName, feedback) => {
  const draft = await CollegeDraft.findById(id);
  if (!draft) throw new ApiError(404, 'College application not found');
  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Cannot request changes to a verified application');
  }
  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Cannot request changes to a rejected application');
  }
  if (!feedback || !feedback.trim()) {
    throw new ApiError(400, 'Feedback is required when requesting changes');
  }

  draft.verificationStatus = 'changes_requested';
  draft.adminFeedback = feedback;

  draft.verificationHistory.push({
    action: 'changes_requested',
    status: 'changes_requested',
    admin: adminId,
    adminName,
    reason: feedback,
    timestamp: new Date(),
  });

  await draft.save();
  return draft;
};

export const rejectApplicationService = async (id, adminId, adminName, reason) => {
  const draft = await CollegeDraft.findById(id);
  if (!draft) throw new ApiError(404, 'College application not found');
  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Cannot reject a verified application. Use suspend instead.');
  }
  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Application is already rejected');
  }
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  draft.verificationStatus = 'rejected';
  draft.rejectionReason = reason;

  draft.verificationHistory.push({
    action: 'rejected',
    status: 'rejected',
    admin: adminId,
    adminName,
    reason,
    timestamp: new Date(),
  });

  await draft.save();
  return draft;
};

export const suspendApplicationService = async (id, adminId, adminName, reason) => {
  const draft = await CollegeDraft.findById(id);
  if (!draft) throw new ApiError(404, 'College application not found');
  if (draft.verificationStatus !== 'verified') {
    throw new ApiError(400, 'Only verified colleges can be suspended');
  }
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'Suspension reason is required');
  }

  draft.verificationStatus = 'suspended';
  draft.suspensionReason = reason;

  draft.verificationHistory.push({
    action: 'suspended',
    status: 'suspended',
    admin: adminId,
    adminName,
    reason,
    timestamp: new Date(),
  });

  await draft.save();

  // Mark the public college as inactive
  await CollegeProfile.updateOne(
    { createdBy: draft.owner },
    { isActive: false },
  );

  return draft;
};

export const getVerificationHistoryService = async (id) => {
  const draft = await CollegeDraft.findById(id)
    .populate('verificationHistory.admin', 'name email')
    .select('verificationHistory')
    .lean();
  if (!draft) throw new ApiError(404, 'College application not found');
  return draft.verificationHistory || [];
};

export const getApplicationStatsService = async () => {
  const stats = await CollegeDraft.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
  ]);

  const statsMap = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    changes_requested: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
  };

  stats.forEach((s) => {
    if (s._id && statsMap.hasOwnProperty(s._id)) statsMap[s._id] = s.count;
  });

  return {
    ...statsMap,
    total: Object.values(statsMap).reduce((a, b) => a + b, 0),
    pending: statsMap.submitted + statsMap.under_review + statsMap.changes_requested,
  };
};