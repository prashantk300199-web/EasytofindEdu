import ScheduleVisit from "../models/ScheduleVisit.js";
import Hostel from "../models/Hostel.js";
import College from "../models/College.js";
import Institute from "../models/Institute.js";

// Create a new visit schedule
export async function createScheduleVisit(req, res) {
  try {
    const {
      studentName,
      studentEmail,
      studentPhone,
      propertyType,
      propertyId,
      preferredDate,
      preferredTime,
      message
    } = req.body;

    // Validate required fields
    if (!studentName || !studentEmail || !studentPhone || !propertyType || !propertyId || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    // Get property name based on type
    let property;
    let propertyName;

    if (propertyType === 'hostel') {
      property = await Hostel.findById(propertyId);
      propertyName = property?.name || 'Unknown Hostel';
    } else if (propertyType === 'college') {
      property = await College.findById(propertyId);
      propertyName = property?.name || 'Unknown College';
    } else if (propertyType === 'institute') {
      property = await Institute.findById(propertyId);
      propertyName = property?.name || 'Unknown Institute';
    }

    if (!property) {
      return res.status(404).json({
        success: false,
        message: `${propertyType} not found`,
      });
    }

    // Create schedule visit
    const scheduleVisit = await ScheduleVisit.create({
      studentName,
      studentEmail,
      studentPhone,
      studentId: req.user?._id || null,
      propertyType,
      propertyId,
      propertyName,
      preferredDate,
      preferredTime,
      message: message || '',
    });

    res.status(201).json({
      success: true,
      message: 'Visit scheduled successfully',
      data: scheduleVisit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get all schedule visits (admin)
export async function getAllScheduleVisits(req, res) {
  try {
    const { status, propertyType, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (propertyType) query.propertyType = propertyType;

    const scheduleVisits = await ScheduleVisit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await ScheduleVisit.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        scheduleVisits,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Update schedule visit status (admin)
export async function updateScheduleVisitStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const scheduleVisit = await ScheduleVisit.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { new: true }
    );

    if (!scheduleVisit) {
      return res.status(404).json({
        success: false,
        message: 'Schedule visit not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Schedule visit updated successfully',
      data: scheduleVisit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get schedule visits for a property
export async function getPropertyScheduleVisits(req, res) {
  try {
    const { propertyId } = req.params;

    const scheduleVisits = await ScheduleVisit.find({ propertyId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: scheduleVisits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// Get user's schedule visits
export async function getUserScheduleVisits(req, res) {
  try {
    const userId = req.user._id;

    const scheduleVisits = await ScheduleVisit.find({ studentId: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: scheduleVisits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
