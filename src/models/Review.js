import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hostel",
    required: true,
    index: true,
  },
  reviewer_name: {
    type: String,
    required: true,
    trim: true,
  },
  reviewer_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  ratings: {
    overall: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    food: { type: Number, required: true, min: 1, max: 5 },
    location: { type: Number, required: true, min: 1, max: 5 },
    value_for_money: { type: Number, required: true, min: 1, max: 5 },
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  is_approved: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

reviewSchema.index({ hostel: 1, reviewer_email: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;