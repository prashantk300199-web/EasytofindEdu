import mongoose from "mongoose";

const collegeCourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      index: true, // For faster search queries
    },
    fullForm: {
      type: String,
      trim: true,
    },
    degreeType: {
      type: String,
      required: [true, "Degree type is required"],
      enum: ["UG", "PG", "Diploma", "Ph.D", "Certificate"], // Strict dropdown options
    },
    stream: {
      type: String,
      required: [true, "Stream is required"],
      index: true,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    duration: {
      value: { 
        type: Number, 
        required: [true, "Duration value is required"],
        min: [0.5, "Duration cannot be less than 0.5"] 
      },
      unit: { 
        type: String, 
        enum: ["Years", "Months", "Weeks"], 
        default: "Years" 
      },
    },
    semesters: {
      type: Number,
      required: [true, "Number of semesters is required"],
      min: [0, "Semesters cannot be negative"],
    },
    internshipIncluded: {
      type: Boolean,
      default: false,
    },
    eligibility: {
      type: String,
      required: [true, "Eligibility criteria is required"],
      trim: true,
    },
    requiredSubjects: [
      {
        type: String,
        trim: true,
      },
    ],
    entranceExamsAccepted: [
      {
        type: String,
        trim: true,
      },
    ],
    intakeSeats: {
      type: Number,
      required: [true, "Intake seats capacity is required"],
      min: [1, "There must be at least 1 seat"],
    },
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// If the model already exists in development hot-reloads, use it, otherwise compile a new one
const CollegeCourse = mongoose.models.CollegeCourse || mongoose.model("CollegeCourse", collegeCourseSchema);

export default CollegeCourse;