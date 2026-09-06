import InstituteDraft from '../models/InstituteDraft.js';
import Institute from '../models/Institute.js';
import ApiError from '../utils/ApiError.js';

/**
 * Get institute applications with pagination, search, and filters
 */
export const getInstituteApplicationsService = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    category = '',
    state = '',
    city = ''
  } = filters;

  const query = {};

  // Search across multiple fields
  if (search) {
    query.$or = [
      { 'step1InstituteInfo.instituteName': { $regex: search, $options: 'i' } },
      { 'step3LocationContact.email': { $regex: search, $options: 'i' } },
      { 'step3LocationContact.phone': { $regex: search, $options: 'i' } },
      { 'step3LocationContact.city': { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by verification status
  if (status) {
    query.verificationStatus = status;
  }

  // Filter by category
  if (category) {
    query['step2Category.primaryCategory'] = category;
  }

  // Filter by location
  if (state) {
    query['step3LocationContact.state'] = state;
  }
  if (city) {
    query['step3LocationContact.city'] = city;
  }

  const skip = (page - 1) * limit;

  const applications = await InstituteDraft.find(query)
    .populate('ownerId', 'name email phone')
    .populate('verifiedBy', 'name email')
    .sort({ submittedAt: -1, updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await InstituteDraft.countDocuments(query);

  return {
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get institute application by ID with full details
 */
export const getInstituteApplicationByIdService = async (id) => {
  const application = await InstituteDraft.findById(id)
    .populate('ownerId', 'name email phone')
    .populate('verifiedBy', 'name email')
    .populate('verificationHistory.admin', 'name email')
    .lean();

  if (!application) {
    throw new ApiError(404, 'Institute application not found');
  }

  return application;
};

/**
 * Approve institute application
 */
export const approveApplicationService = async (id, adminId, adminName) => {
  const draft = await InstituteDraft.findById(id);

  if (!draft) {
    throw new ApiError(404, 'Institute application not found');
  }

  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Application is already verified');
  }

  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Cannot approve a rejected application');
  }

  // Validate required fields
  if (!draft.step1InstituteInfo?.instituteName) {
    throw new ApiError(400, 'Institute name is required');
  }

  if (!draft.step14Verification?.ownerName || !draft.step14Verification?.idProofFile) {
    throw new ApiError(400, 'Verification documents are incomplete');
  }

  // Update verification status
  draft.verificationStatus = 'verified';
  draft.verifiedAt = new Date();
  draft.verifiedBy = adminId;

  // Add to verification history
  draft.verificationHistory.push({
    action: 'approved',
    status: 'verified',
    admin: adminId,
    adminName: adminName,
    timestamp: new Date()
  });

  await draft.save();

  // Create or update Institute record for public access
  // This will be used in Phase 9 for public institute listing
  const instituteData = {
    name: draft.step1InstituteInfo.instituteName,
    description: draft.step1InstituteInfo.description,
    logo: draft.step1InstituteInfo.logoFile,
    coverImage: draft.step1InstituteInfo.coverImageFile,
    establishedYear: draft.step1InstituteInfo.establishedYear,

    category: draft.step2Category?.primaryCategory,
    subcategories: draft.step2Category?.subcategories || [],

    location: {
      state: draft.step3LocationContact?.state,
      cityName: draft.step3LocationContact?.city,
      areaName: draft.step3LocationContact?.area,
      subareaName: draft.step3LocationContact?.subarea,
      pincode: draft.step3LocationContact?.pincode,
      fullAddress: draft.step3LocationContact?.fullAddress,
      landmark: draft.step3LocationContact?.landmark
    },

    contact: {
      email: draft.step3LocationContact?.email,
      phone: draft.step3LocationContact?.phone,
      alternatePhone: draft.step3LocationContact?.alternatePhone,
      website: draft.step3LocationContact?.website
    },

    facilities: draft.step7Facilities?.facilities || [],

    createdBy: draft.ownerId,
    isActive: true,
    isApproved: true
  };

  await Institute.findOneAndUpdate(
    { createdBy: draft.ownerId },
    instituteData,
    { upsert: true, new: true }
  );

  return draft;
};

/**
 * Request changes to institute application
 */
export const requestChangesService = async (id, adminId, adminName, feedback) => {
  const draft = await InstituteDraft.findById(id);

  if (!draft) {
    throw new ApiError(404, 'Institute application not found');
  }

  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Cannot request changes to a verified application');
  }

  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Cannot request changes to a rejected application');
  }

  if (!feedback || feedback.trim().length === 0) {
    throw new ApiError(400, 'Feedback is required when requesting changes');
  }

  // Update status
  draft.verificationStatus = 'changes_requested';
  draft.adminFeedback = feedback;

  // Add to verification history
  draft.verificationHistory.push({
    action: 'changes_requested',
    status: 'changes_requested',
    admin: adminId,
    adminName: adminName,
    reason: feedback,
    timestamp: new Date()
  });

  await draft.save();

  return draft;
};

/**
 * Reject institute application
 */
export const rejectApplicationService = async (id, adminId, adminName, reason) => {
  const draft = await InstituteDraft.findById(id);

  if (!draft) {
    throw new ApiError(404, 'Institute application not found');
  }

  if (draft.verificationStatus === 'verified') {
    throw new ApiError(400, 'Cannot reject a verified application. Use suspend instead.');
  }

  if (draft.verificationStatus === 'rejected') {
    throw new ApiError(400, 'Application is already rejected');
  }

  if (!reason || reason.trim().length === 0) {
    throw new ApiError(400, 'Rejection reason is required');
  }

  // Update status
  draft.verificationStatus = 'rejected';
  draft.rejectionReason = reason;

  // Add to verification history
  draft.verificationHistory.push({
    action: 'rejected',
    status: 'rejected',
    admin: adminId,
    adminName: adminName,
    reason: reason,
    timestamp: new Date()
  });

  await draft.save();

  return draft;
};

/**
 * Suspend verified institute
 */
export const suspendApplicationService = async (id, adminId, adminName, reason) => {
  const draft = await InstituteDraft.findById(id);

  if (!draft) {
    throw new ApiError(404, 'Institute application not found');
  }

  if (draft.verificationStatus !== 'verified') {
    throw new ApiError(400, 'Only verified institutes can be suspended');
  }

  if (!reason || reason.trim().length === 0) {
    throw new ApiError(400, 'Suspension reason is required');
  }

  // Update status
  draft.verificationStatus = 'suspended';
  draft.suspensionReason = reason;

  // Add to verification history
  draft.verificationHistory.push({
    action: 'suspended',
    status: 'suspended',
    admin: adminId,
    adminName: adminName,
    reason: reason,
    timestamp: new Date()
  });

  await draft.save();

  // Update Institute record to mark as inactive
  await Institute.updateOne(
    { createdBy: draft.ownerId },
    { isActive: false }
  );

  return draft;
};

/**
 * Get verification history for an application
 */
export const getVerificationHistoryService = async (id) => {
  const draft = await InstituteDraft.findById(id)
    .populate('verificationHistory.admin', 'name email')
    .select('verificationHistory')
    .lean();

  if (!draft) {
    throw new ApiError(404, 'Institute application not found');
  }

  return draft.verificationHistory || [];
};

/**
 * Get application statistics
 */
export const getApplicationStatsService = async () => {
  const stats = await InstituteDraft.aggregate([
    {
      $group: {
        _id: '$verificationStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsMap = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    changes_requested: 0,
    verified: 0,
    rejected: 0,
    suspended: 0
  };

  stats.forEach(stat => {
    if (stat._id && statsMap.hasOwnProperty(stat._id)) {
      statsMap[stat._id] = stat.count;
    }
  });

  return {
    ...statsMap,
    total: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
    pending: statsMap.submitted + statsMap.under_review + statsMap.changes_requested
  };
};
