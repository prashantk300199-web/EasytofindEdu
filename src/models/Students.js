import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const STUDENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  BLOCKED: "blocked",
};

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },
    lastQualification: {
      type: String,
      trim: true,
      default: "",
      // e.g. "10th", "12th", "Graduation", "Post Graduation"
    },
    status: {
      type: String,
      enum: Object.values(STUDENT_STATUS),
      default: STUDENT_STATUS.PENDING,
    },

    // Profile
    profilePhoto: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    dateOfBirth: {
      type: Date,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // Address
    address: {
      line1:   { type: String, default: "" },
      line2:   { type: String, default: "" },
      city:    { type: String, default: "" },
      state:   { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },

    // Academic background
    academicDetails: {
      schoolName:      { type: String, default: "" },
      boardOrUniversity: { type: String, default: "" },
      passingYear:     { type: String, default: "" },
      percentage:      { type: String, default: "" },
    },

    // Interests / preferred subjects
    preferredSubjects: [{ type: String, trim: true }],

    // Enrolled batches (reference)
    enrolledBatches: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    ],
  },
  { timestamps: true }
);

// Hash password before save
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from JSON responses
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Student = mongoose.model("Student", studentSchema);
export default Student;