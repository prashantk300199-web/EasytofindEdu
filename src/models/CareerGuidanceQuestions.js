import mongoose from "mongoose";
import { QUESTION_TYPES, QUESTION_CATEGORIES } from "../constants/careerGuidance.constants.js";

// Option schema WITHOUT unique constraint (can repeat across questions)
const questionOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      lowercase: true,
      // REMOVED: unique: true - This was causing the conflict
      // Options values can repeat across different questions
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const careerGuidanceQuestionSchema = new mongoose.Schema(
  {
    // Question Metadata
    questionNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPES),
      required: true,
      default: QUESTION_TYPES.SINGLE_SELECT,
    },
    category: {
      type: String,
      enum: Object.values(QUESTION_CATEGORIES),
      required: true,
      index: true,
    },

    // Options (for select/radio/dropdown)
    options: {
      type: [questionOptionSchema],
      default: [],
    },

    // Validation Rules
    isRequired: {
      type: Boolean,
      default: false,
    },
    minSelections: {
      type: Number,
      default: 0,
    },
    maxSelections: {
      type: Number,
      default: null,
    },

    // Help & Context
    helpText: {
      type: String,
      default: "",
      maxlength: 300,
    },
    placeholder: {
      type: String,
      default: "",
    },

    // Conditional Logic
    showIfAnswer: {
      previousQuestionId: mongoose.Schema.Types.ObjectId,
      selectedValue: String,
    },

    // Visibility
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // Tags for analytics
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// REMOVED duplicate indexes - only define once
// Define indexes efficiently
careerGuidanceQuestionSchema.index({ category: 1, isActive: 1 });
careerGuidanceQuestionSchema.index({ displayOrder: 1 }); // Only one definition

// Virtuals
careerGuidanceQuestionSchema.virtual("totalOptions").get(function () {
  return this.options?.length || 0;
});

// Methods
careerGuidanceQuestionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const CareerGuidanceQuestion = mongoose.model(
  "CareerGuidanceQuestion",
  careerGuidanceQuestionSchema
);

export default CareerGuidanceQuestion;