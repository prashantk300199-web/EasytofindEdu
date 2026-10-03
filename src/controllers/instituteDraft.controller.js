import InstituteDraft from '../models/InstituteDraft.js';
import { uploadOnCloudinary } from '../config/cloudinary.js';

// Get draft for logged-in owner (any status — owner must be able to
// re-open and edit a submitted/changes_requested application).
export const getDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    let draft = await InstituteDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });

    if (!draft) {
      // No record at all — create a fresh one.
      draft = new InstituteDraft({
        owner: ownerId,
        status: 'draft',
        currentStep: 1,
        completionPercentage: 0
      });
      await draft.save();
    }

    res.status(200).json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve draft',
      error: error.message
    });
  }
};

// Save draft (manual save or auto-save). Works for any status so the
// owner can keep editing a submitted or changes_requested application.
export const saveDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;
    const {
      currentStep,
      step1InstituteInfo,
      step2Category,
      step3LocationContact,
      step4Courses,
      step5Batches,
      step6LearningExperience,
      step7Facilities,
      step8Faculty,
      step9Fees,
      step10Admission,
      step11Career,
      step12Results,
      step13Gallery,
      step14Verification
    } = req.body;

    let draft = await InstituteDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });

    if (!draft) {
      draft = new InstituteDraft({ owner: ownerId, status: 'draft' });
    }

    // Update fields - Phase 6 supports all 14 steps
    if (currentStep) draft.currentStep = currentStep;
    if (step1InstituteInfo) draft.step1InstituteInfo = { ...draft.step1InstituteInfo, ...step1InstituteInfo };
    if (step2Category) draft.step2Category = { ...draft.step2Category, ...step2Category };
    if (step3LocationContact) draft.step3LocationContact = { ...draft.step3LocationContact, ...step3LocationContact };
    if (step4Courses) draft.step4Courses = { ...draft.step4Courses, ...step4Courses };
    if (step5Batches) draft.step5Batches = { ...draft.step5Batches, ...step5Batches };
    if (step6LearningExperience) draft.step6LearningExperience = { ...draft.step6LearningExperience, ...step6LearningExperience };
    if (step7Facilities) draft.step7Facilities = { ...draft.step7Facilities, ...step7Facilities };
    if (step8Faculty) draft.step8Faculty = { ...draft.step8Faculty, ...step8Faculty };
    if (step9Fees) draft.step9Fees = { ...draft.step9Fees, ...step9Fees };
    if (step10Admission) draft.step10Admission = { ...draft.step10Admission, ...step10Admission };
    if (step11Career) draft.step11Career = { ...draft.step11Career, ...step11Career };
    if (step12Results) draft.step12Results = { ...draft.step12Results, ...step12Results };
    if (step13Gallery) draft.step13Gallery = { ...draft.step13Gallery, ...step13Gallery };
    if (step14Verification) draft.step14Verification = { ...draft.step14Verification, ...step14Verification };

    // Calculate completion percentage
    draft.calculateCompletion();

    // Update last saved timestamp
    draft.lastSavedAt = new Date();

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      data: {
        currentStep: draft.currentStep,
        completionPercentage: draft.completionPercentage,
        lastSavedAt: draft.lastSavedAt
      }
    });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message
    });
  }
};

// Upload file for draft (images, documents)
export const uploadDraftFile = async (req, res) => {
  try {
    const ownerId = req.owner._id;
    const { fieldName, stepNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await uploadOnCloudinary(req.file, {
      folder: `institute-drafts/${ownerId}`,
      resource_type: 'auto'
    });

    // Get or create draft. Works for any status so the owner can keep
    // editing after submission.
    let draft = await InstituteDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });

    if (!draft) {
      draft = new InstituteDraft({ owner: ownerId, status: 'draft' });
    }

    // Store file URL based on step and field
    const fileUrl = result.secure_url;
    const stepKey = `step${stepNumber}`;

    if (!draft[stepKey]) {
      draft[stepKey] = {};
    }

    draft[stepKey][fieldName] = fileUrl;
    draft.lastSavedAt = new Date();

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        fieldName,
        stepNumber
      }
    });
  } catch (error) {
    console.error('Upload draft file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

// Submit draft for verification (final submission, or resubmit after
// the owner edits a submitted / changes_requested application).
export const submitDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    // Find the owner's most recent draft. Owner can re-submit as long as
    // the application isn't already verified, rejected, or suspended.
    const draft = await InstituteDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found to submit'
      });
    }

    // Block re-submit if already approved, rejected, or suspended.
    if (
      draft.verificationStatus === 'verified' ||
      draft.verificationStatus === 'rejected' ||
      draft.verificationStatus === 'suspended'
    ) {
      return res.status(400).json({
        success: false,
        message: `Application cannot be resubmitted while status is "${draft.verificationStatus}"`
      });
    }

    // Validate required fields
    if (!draft.step1InstituteInfo?.instituteName) {
      return res.status(400).json({
        success: false,
        message: 'Institute name is required'
      });
    }

    if (!draft.step14Verification?.ownerName || !draft.step14Verification?.idProofPreview) {
      return res.status(400).json({
        success: false,
        message: 'Verification documents are required'
      });
    }

    // Update status to submitted (or re-submitted)
    draft.status = 'submitted';
    draft.verificationStatus = 'submitted';
    draft.submittedAt = new Date();
    draft.currentStep = 14;
    draft.completionPercentage = 100;
    draft.lastSavedAt = new Date();

    // Clear admin feedback on resubmission
    if (draft.adminFeedback) {
      draft.adminFeedback = '';
    }

    // Add to verification history
    if (!draft.verificationHistory) {
      draft.verificationHistory = [];
    }

    const isResubmission = draft.verificationHistory.some(
      (h) => h.action === 'submitted' || h.action === 'resubmitted'
    );

    draft.verificationHistory.push({
      action: isResubmission ? 'resubmitted' : 'submitted',
      status: 'submitted',
      timestamp: new Date()
    });

    await draft.save();

    res.status(200).json({
      success: true,
      message: isResubmission
        ? 'Application resubmitted successfully. Your updates will be reviewed by our team.'
        : 'Registration submitted successfully. Your institute will be reviewed by our team.',
      data: draft
    });
  } catch (error) {
    console.error('Submit draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration',
      error: error.message
    });
  }
};

// Delete draft
export const deleteDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const draft = await InstituteDraft.findOneAndDelete({
      owner: ownerId,
      status: 'draft'
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found to delete'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete draft',
      error: error.message
    });
  }
};

// Get draft status for dashboard
export const getDraftStatus = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    // Find the most recent institute draft/submission for this owner (any status)
    const draft = await InstituteDraft.findOne({
      owner: ownerId
    })
    .sort({ updatedAt: -1, lastSavedAt: -1 })
    .select('_id currentStep completionPercentage lastSavedAt submittedAt status verificationStatus step1InstituteInfo adminFeedback rejectionReason verifiedAt verifiedBy');

    res.status(200).json({
      success: true,
      data: draft || null
    });
  } catch (error) {
    console.error('Get draft status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get draft status',
      error: error.message
    });
  }
};
