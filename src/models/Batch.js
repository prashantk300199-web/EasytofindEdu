import mongoose from 'mongoose';
// In models/Batch.js - UPDATE THIS LINE
const batchSchema = new mongoose.Schema({
  institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batchName: { type: String, required: true },
  startDate: Date,
  timing: String,
  duration: String,
  studentsPerBatch: Number,
  mode: { type: String, enum: ['Online', 'Offline'] },
  totalSeats: { type: Number, required: true },
  seatsAvailable: { type: Number, required: false }, 
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

batchSchema.pre('save', function(next) {
  if (this.isNew) {
    this.seatsAvailable = this.totalSeats;
  }
  next();
});

export default mongoose.model('Batch', batchSchema);
