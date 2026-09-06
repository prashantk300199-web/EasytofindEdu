import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    // Who submitted
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // What they're enquiring about
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Form fields
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    preferredContactTime: {
      type: String,
      enum: ["Morning (9AM-12PM)", "Afternoon (12PM-4PM)", "Evening (4PM-8PM)", "Any Time"],
      default: "Any Time",
    },
    willingToVisit: {
      type: Boolean,
      default: false,
    },
    expectedJoiningDate: {
      type: String, // "immediately", "within 1 month", "within 3 months", "just exploring"
      enum: ["Immediately", "Within 1 Month", "Within 3 Months", "Just Exploring"],
      default: "Just Exploring",
    },

    // Student contact snapshot (so owner gets it even if student updates profile later)
    studentSnapshot: {
      name:  { type: String },
      email: { type: String },
      phone: { type: String },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["pending", "contacted", "enrolled", "closed"],
      default: "pending",
    },

    // Admin / owner notes
    adminNote: {
      type: String,
      default: "",
    },

    // Email sent confirmation
    emailSentToOwner: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate enquiry from same student for same batch
enquirySchema.index({ student: 1, batch: 1 }, { unique: true });

const Enquiry = mongoose.model("Enquiry", enquirySchema);
export default Enquiry;