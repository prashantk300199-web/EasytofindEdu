import mongoose from "mongoose";

const cgCollegeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "CGCourse" }],
  },
  { timestamps: true }
);

export default mongoose.model("CGCollege", cgCollegeSchema);
