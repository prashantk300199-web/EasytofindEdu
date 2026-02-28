import mongoose from 'mongoose';

const subAreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true }
});

export default mongoose.model('SubArea', subAreaSchema);
