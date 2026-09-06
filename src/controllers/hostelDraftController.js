import Hostel from "../models/Hostel.js";
import asyncHandler from "express-async-handler";

// @desc    Save hostel listing as draft
// @route   POST /api/v1/hostels/draft
// @access  Private (Owner)
export const saveDraft = asyncHandler(async (req, res) => {
  const { formData, amenities, step } = req.body;
  const ownerId = req.user._id;

  // Check if there's an existing draft for this owner
  let draft = await Hostel.findOne({ owner: ownerId, isDraft: true });

  const draftData = {
    formData,
    amenities,
    step,
    lastSaved: new Date(),
  };

  if (draft) {
    // Update existing draft
    draft.draftData = draftData;
    draft.name = formData.name || 'Draft Hostel';
    await draft.save();
  } else {
    // Create new draft
    draft = await Hostel.create({
      owner: ownerId,
      name: formData.name || 'Draft Hostel',
      hostel_type: formData.hostel_type || 'girls',
      description: formData.description || 'Draft description',
      isDraft: true,
      draftData,
      address: {
        line1: formData.line1 || 'Draft',
        city: formData.city || 'Patna',
        state: formData.state || 'Bihar',
        country: 'India',
        pincode: formData.pincode || '800001',
      },
      location: {
        type: 'Point',
        coordinates: [85.1376, 25.5941],
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Draft saved successfully',
    data: draft,
  });
});

// @desc    Get owner's draft
// @route   GET /api/v1/hostels/draft
// @access  Private (Owner)
export const getDraft = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const draft = await Hostel.findOne({ owner: ownerId, isDraft: true });

  if (!draft) {
    return res.status(404).json({
      success: false,
      message: 'No draft found',
    });
  }

  res.status(200).json({
    success: true,
    data: draft,
  });
});

// @desc    Delete draft
// @route   DELETE /api/v1/hostels/draft/:id
// @access  Private (Owner)
export const deleteDraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user._id;

  const draft = await Hostel.findOne({ _id: id, owner: ownerId, isDraft: true });

  if (!draft) {
    return res.status(404).json({
      success: false,
      message: 'Draft not found',
    });
  }

  await draft.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Draft deleted successfully',
  });
});
