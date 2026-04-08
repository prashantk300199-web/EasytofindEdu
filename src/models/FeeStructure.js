import mongoose from 'mongoose';

const installmentDetailSchema = new mongoose.Schema({
  amount: Number,
  dueDate: Date
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
  institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  actualFee: Number,
  registrationAmount: Number,
  installmentAvailable: Boolean,
  installmentDetails: [installmentDetailSchema],
  scholarshipAvailable: Boolean,
  scholarshipPercentage: Number,
  scholarshipEligibility: String,
  easyToFindOfferPrice: Number,
  refundPolicy: String
}, { timestamps: true });

export default mongoose.model('FeeStructure', feeStructureSchema);
