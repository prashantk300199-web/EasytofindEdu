import mongoose from "mongoose";

const cgExamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "CGCourse", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("CGExam", cgExamSchema);
