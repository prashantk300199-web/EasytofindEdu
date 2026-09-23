import mongoose from "mongoose";

const MESSAGE_ROLES = {
  USER: "user",
  AI: "model",
  SYSTEM: "system",
};

const CONVERSATION_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
};

const conversationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
      maxlength: 200,
    },
    messages: [
      {
        role: {
          type: String,
          enum: Object.values(MESSAGE_ROLES),
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: 8000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    context: {
      educationLevel: { type: String, default: "" },
      stream: { type: String, default: "" },
      interests: [{ type: String }],
      skills: [{ type: String }],
      workPreferences: { type: String, default: "" },
      constraints: { type: String, default: "" },
      savedCareers: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerPathNode" }],
      recommendations: [
        {
          nodeId: mongoose.Schema.Types.ObjectId,
          matchScore: Number,
          generatedAt: Date,
        },
      ],
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      default: CONVERSATION_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

// Indexes
conversationSchema.index({ studentId: 1, status: 1 });
conversationSchema.index({ studentId: 1, lastMessageAt: -1 });

// Increment message count and update lastMessageAt on save
conversationSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.messageCount = this.messages.length;
    this.lastMessageAt = new Date();
    // Auto-generate title from first user message if default
    if (this.title === "New Conversation" && this.messages.length > 0) {
      const firstUserMsg = this.messages.find((m) => m.role === MESSAGE_ROLES.USER);
      if (firstUserMsg) {
        this.title = firstUserMsg.content.substring(0, 80).trim() + (firstUserMsg.content.length > 80 ? "..." : "");
      }
    }
  }
  next();
});

const CareerAIConversation = mongoose.model(
  "CareerAIConversation",
  conversationSchema
);

export default CareerAIConversation;
