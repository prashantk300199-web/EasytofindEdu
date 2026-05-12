import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true // 🚀 SEO & Fast Routing ke liye index
  },
  content: { 
    type: String, 
    required: true 
    // 🚀 Yahan Rich Text Editor ka pura HTML aayega (Bold, italic, links sab)
  },
  excerpt: { 
    type: String, 
    required: true,
    maxLength: 300 
    // 🚀 Google Search mein jo short description dikhta hai uske liye
  },
  coverImage: { 
    publicId: String,
    url: String 
  },
  authorName: { 
    type: String, 
    default: 'Vidya Marg Team' 
  },
  category: { 
    type: String, 
    required: true 
  },
  tags: [{ 
    type: String 
    // 🚀 Tags for filtering and SEO (e.g., "JEE", "NEET", "Hostel Tips")
  }],
  status: { 
    type: String, 
    enum: ['Draft', 'Published'], 
    default: 'Published' 
  },
  views: { 
    type: Number, 
    default: 0 
  },
  publishedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Text search ke liye index (Aage chal kar search bar bananey me kaam aayega)
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('Blog', blogSchema);