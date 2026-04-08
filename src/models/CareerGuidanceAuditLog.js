import mongoose from "mongoose";

const careerGuidanceAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE_QUESTION",
        "UPDATE_QUESTION",
        "DELETE_QUESTION",
        "CREATE_NODE",
        "UPDATE_NODE",
        "DELETE_NODE",
        "BULK_IMPORT",
        "FEATURE_NODE",
        "UNFEATURE_NODE",
      ],
      index: true,
    },

    // Admin Info
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    // Resource Info
    resourceType: {
      type: String,
      enum: ["QUESTION", "NODE"],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    // Changes
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    // Details
    description: String,
    ipAddress: String,
    userAgent: String,

    // Status
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
    errorMessage: String,

    // Timestamps
    performedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    indexes: [
      { adminId: 1, performedAt: -1 },
      { action: 1, performedAt: -1 },
      { resourceType: 1, resourceId: 1 },
    ],
  }
);

// TTL Index - Keep logs for 1 year then delete
careerGuidanceAuditLogSchema.index({ performedAt: 1 }, { expireAfterSeconds: 31536000 });

const CareerGuidanceAuditLog = mongoose.model(
  "CareerGuidanceAuditLog",
  careerGuidanceAuditLogSchema
);

export default CareerGuidanceAuditLog;