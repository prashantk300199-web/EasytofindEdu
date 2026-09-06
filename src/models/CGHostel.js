import mongoose from "mongoose";

const cgHostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("CGHostel", cgHostelSchema);
