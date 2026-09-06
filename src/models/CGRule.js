import mongoose from "mongoose";

const cgRuleSchema = new mongoose.Schema(
  {
    stream: { type: String, required: true },
    interest: { type: String, required: true },
    strength: { type: String, required: true },
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: "CGCareer", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("CGRule", cgRuleSchema);
