import mongoose from "mongoose";

const scheduleVisitSchema = new mongoose.Schema({
  // Student details
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  studentPhone: {
    type: String,
    required: true,
    trim: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
  },

  // Property details
  propertyType: {
    type: String,
    enum: ['hostel', 'college', 'institute'],
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  propertyName: {
    type: String,
    required: true,
  },

  // Visit details
  preferredDate: {
    type: Date,
    required: true,
  },
  preferredTime: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },

  // Admin notes
  adminNotes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

scheduleVisitSchema.index({ studentEmail: 1, propertyId: 1 });
scheduleVisitSchema.index({ status: 1, preferredDate: 1 });

const ScheduleVisit = mongoose.model("ScheduleVisit", scheduleVisitSchema);

export default ScheduleVisit;
