import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institute",
    required: true,
  },
  course: {
    type: String, // Or ObjectId if courses are models
    required: true,
  },
  studentDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    fatherName: { type: String },
    lastQualification: { type: String },
    percentage: { type: String },
  },
  status: {
    type: String,
    enum: ["pending", "contacted", "admitted", "rejected"],
    default: "pending",
  },
  message: {
    type: String,
    default: "",
  }
}, { timestamps: true });

const Admission = mongoose.model("Admission", admissionSchema);
export default Admission;
