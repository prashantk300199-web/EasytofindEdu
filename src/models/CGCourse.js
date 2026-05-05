import mongoose from "mongoose";

const cgCourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: "CGCareer", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("CGCourse", cgCourseSchema);
