import InstituteDraft from '../models/InstituteDraft.js';
import { uploadOnCloudinary } from '../config/cloudinary.js';

// Get draft for logged-in owner
export const getDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    let draft = await InstituteDraft.findOne({
      owner: ownerId,
      status: 'draft'
    }).sort({ lastSavedAt: -1 });

    if (!draft) {
      // Create new draft if none exists
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

// Save draft (manual save or auto-save)
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

    let draft = await InstituteDraft.findOne({
      owner: ownerId,
      status: 'draft'
    });

    if (!draft) {
      draft = new InstituteDraft({ owner: ownerId });
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

    // Get or create draft
    let draft = await InstituteDraft.findOne({
      owner: ownerId,
      status: 'draft'
    });

    if (!draft) {
      draft = new InstituteDraft({ owner: ownerId });
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

// Submit draft for verification (final submission)
export const submitDraft = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    const draft = await InstituteDraft.findOne({
      owner: ownerId,
      status: 'draft'
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'No draft found to submit'
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

    // Update status to submitted
    draft.status = 'submitted';
    draft.currentStep = 14;
    draft.completionPercentage = 100;
    draft.lastSavedAt = new Date();

    await draft.save();

    res.status(200).json({
      success: true,
      message: 'Registration submitted successfully. Your institute will be reviewed by our team.',
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

    const draft = await InstituteDraft.findOne({
      owner: ownerId,
      status: 'draft'
    }).select('currentStep completionPercentage lastSavedAt status');

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
