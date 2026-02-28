import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: true },
  year: { type: Number, required: true },
  examType: { type: String, required: true },
  totalStudentsQualified: { type: Number, required: true },
  rankersListImage: { 
    publicId: String,
    url: String 
  },
  achievementSummary: String, // Optional text summary
  certificatesImage: { 
    publicId: String,
    url: String 
  }
}, { timestamps: true });

export default mongoose.model('Result', resultSchema);
