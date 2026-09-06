import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    lookingFor: {
      type: String,
      required: [true, "Looking For is required"],
      enum: ["Hostel", "Institute", "College"],
    },
    
    // Conditional fields (optional in schema level, validated in logic if needed)
    // Hostel
    budget: String,
    bedType: String,
    area: String,
    state: String,
    
    // Institute
    courseType: String,
    otherSkill: String,
    
    // College
    stream: String,

    status: {
      type: String,
      enum: ["pending", "contacted", "closed"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);
export default Inquiry;
