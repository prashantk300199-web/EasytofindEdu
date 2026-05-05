import mongoose from "mongoose";

const cgCareerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("CGCareer", cgCareerSchema);
