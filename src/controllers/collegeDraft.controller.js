import CollegeDraft from '../models/CollegeDraft.js';
import { uploadOnCloudinary } from '../config/cloudinary.js';

// Get draft for logged-in owner (any status — owner can re-open submitted / changes_requested).
export const getDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    let draft = await CollegeDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });
    if (!draft) {
      draft = new CollegeDraft({
        owner: ownerId,
        status: 'draft',
        currentStep: 1,
        completionPercentage: 0,
      });
      await draft.save();
    }

    res.status(200).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    console.error('Get college draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve draft',
      error: error.message,
    });
  }
};

// Save draft (manual or auto-save).
export const saveDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;
    const {
      currentStep,
      step1BasicInfo,
      step2Location,
      step3Affiliation,
      step4Courses,
      step5AdmissionFees,
      step6Facilities,
      step7Hostel,
      step8Placements,
      step9Scholarships,
      step10Gallery,
      step11Documents,
    } = req.body;

    let draft = await CollegeDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });
    if (!draft) {
      draft = new CollegeDraft({ owner: ownerId, status: 'draft' });
    }

    if (currentStep) draft.currentStep = currentStep;
    if (step1BasicInfo) draft.step1BasicInfo = { ...draft.step1BasicInfo?.toObject?.() ?? draft.step1BasicInfo, ...step1BasicInfo };
    if (step2Location) draft.step2Location = { ...draft.step2Location?.toObject?.() ?? draft.step2Location, ...step2Location };
    if (step3Affiliation) draft.step3Affiliation = { ...draft.step3Affiliation?.toObject?.() ?? draft.step3Affiliation, ...step3Affiliation };
    if (step4Courses) draft.step4Courses = { ...draft.step4Courses?.toObject?.() ?? draft.step4Courses, ...step4Courses };
    if (step5AdmissionFees) draft.step5AdmissionFees = { ...draft.step5AdmissionFees?.toObject?.() ?? draft.step5AdmissionFees, ...step5AdmissionFees };
    if (step6Facilities) draft.step6Facilities = { ...draft.step6Facilities?.toObject?.() ?? draft.step6Facilities, ...step6Facilities };
    if (step7Hostel) draft.step7Hostel = { ...draft.step7Hostel?.toObject?.() ?? draft.step7Hostel, ...step7Hostel };
    if (step8Placements) draft.step8Placements = { ...draft.step8Placements?.toObject?.() ?? draft.step8Placements, ...step8Placements };
    if (step9Scholarships) draft.step9Scholarships = { ...draft.step9Scholarships?.toObject?.() ?? draft.step9Scholarships, ...step9Scholarships };
    if (step10Gallery) draft.step10Gallery = { ...draft.step10Gallery?.toObject?.() ?? draft.step10Gallery, ...step10Gallery };
    if (step11Documents) draft.step11Documents = { ...draft.step11Documents?.toObject?.() ?? draft.step11Documents, ...step11Documents };

    draft.calculateCompletion();
    draft.lastSavedAt = new Date();

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'Draft saved successfully',
      data: {
        currentStep: draft.currentStep,
        completionPercentage: draft.completionPercentage,
        lastSavedAt: draft.lastSavedAt,
      },
    });
  } catch (error) {
    console.error('Save college draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft',
      error: error.message,
    });
  }
};

// Upload file for draft (logo, cover, gallery, brochure, documents, etc.).
// Unlike the institute flow which overwrites galleryFiles, the college flow
// APPENDS to the array so the gallery actually accumulates every upload.
export const uploadDraftFile = async (req, res) => {
  try {
    const ownerId = req.owner._id;
    const { fieldName, stepNumber, append, arrayField } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const result = await uploadOnCloudinary(req.file, {
      folder: `college-drafts/${ownerId}`,
      resource_type: 'auto',
    });

    const fileUrl = result.url;
    if (!fileUrl) {
      return res.status(502).json({
        success: false,
        message: 'File storage service returned no URL. Please try again.',
      });
    }
    const stepKey = `step${stepNumber}`;

    let draft = await CollegeDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });
    if (!draft) {
      draft = new CollegeDraft({ owner: ownerId, status: 'draft' });
    }

    if (!draft[stepKey]) draft[stepKey] = {};

    // Gallery uses an array — caller signals with append=true + arrayField.
    if (append === 'true' || append === true) {
      const targetKey = arrayField || fieldName;
      if (!Array.isArray(draft[stepKey][targetKey])) {
        draft[stepKey][targetKey] = [];
      }
      draft[stepKey][targetKey].push(fileUrl);
    } else {
      draft[stepKey][fieldName] = fileUrl;
    }
    draft.lastSavedAt = new Date();

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: fileUrl,
        fieldName,
        stepNumber,
      },
    });
  } catch (error) {
    console.error('Upload college draft file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message,
    });
  }
};

// Submit draft for verification. Same logic as instituteDraft.
export const submitDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const draft = await CollegeDraft.findOne({ owner: ownerId }).sort({ lastSavedAt: -1 });
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found to submit',
      });
    }

    if (
      draft.verificationStatus === 'verified' ||
      draft.verificationStatus === 'rejected' ||
      draft.verificationStatus === 'suspended'
    ) {
      return res.status(400).json({
        success: false,
        message: `Application cannot be resubmitted while status is "${draft.verificationStatus}"`,
      });
    }

    if (!draft.step1BasicInfo?.collegeName) {
      return res.status(400).json({
        success: false,
        message: 'College name is required',
      });
    }

    draft.status = 'submitted';
    draft.verificationStatus = 'submitted';
    draft.submittedAt = new Date();
    draft.currentStep = 12;
    draft.completionPercentage = 100;
    draft.lastSavedAt = new Date();

    if (draft.adminFeedback) draft.adminFeedback = '';

    if (!draft.verificationHistory) draft.verificationHistory = [];

    const isResubmission = draft.verificationHistory.some(
      (h) => h.action === 'submitted' || h.action === 'resubmitted',
    );

    draft.verificationHistory.push({
      action: isResubmission ? 'resubmitted' : 'submitted',
      status: 'submitted',
      timestamp: new Date(),
    });

    await draft.save();

    res.status(200).json({
      success: true,
      message: isResubmission
        ? 'Application resubmitted successfully. Your updates will be reviewed by our team.'
        : 'Registration submitted successfully. Your college will be reviewed by our team.',
      data: draft,
    });
  } catch (error) {
    console.error('Submit college draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration',
      error: error.message,
    });
  }
};

export const deleteDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const draft = await CollegeDraft.findOneAndDelete({
      owner: ownerId,
      status: 'draft',
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found to delete',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    console.error('Delete college draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete draft',
      error: error.message,
    });
  }
};

export const getDraftStatus = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const draft = await CollegeDraft.findOne({ owner: ownerId })
      .sort({ updatedAt: -1, lastSavedAt: -1 })
      .select('_id currentStep completionPercentage lastSavedAt submittedAt status verificationStatus step1BasicInfo adminFeedback rejectionReason verifiedAt verifiedBy');

    res.status(200).json({
      success: true,
      data: draft || null,
    });
  } catch (error) {
    console.error('Get college draft status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get draft status',
      error: error.message,
    });
  }
};