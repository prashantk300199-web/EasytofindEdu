import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    mode: { type: String, enum: ['English', 'Hindi', 'Hinglish'] },
    image: { 
      publicId: String,
      url: String 
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }, { timestamps: true });
  
export default mongoose.model('Course', courseSchema);
