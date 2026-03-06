import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    mode: { type: String, enum: ['English', 'Hindi', 'Hinglish'] },
    image: { 
      publicId: String,
      url: String 
    },
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'InstituteOwner' },
  }, { timestamps: true });
  
export default mongoose.model('Course', courseSchema);
