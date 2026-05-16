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
        // Program-related actions
        "CREATE_PROGRAM",
        "UPDATE_PROGRAM",
        "PUBLISH_PROGRAM",
        "ARCHIVE_PROGRAM",
        "ADD_EXAM_TO_PROGRAM",
        "ADD_COLLEGE_TO_PROGRAM",
        "BULK_IMPORT_PROGRAMS",
        // Fallback for unknown actions
        "UNKNOWN",
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
      enum: ["QUESTION", "NODE", "PROGRAM"],
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

// Backwards-compatibility: map legacy payload fields to the new schema before validation
careerGuidanceAuditLogSchema.pre("validate", function (next) {
  try {
    // If older code passed `targetModel` / `targetId`, map them to `resourceType` / `resourceId`
    const doc = this._doc || this;

    if (!this.resourceType && doc.targetModel) {
      const map = {
        CareerProgram: "PROGRAM",
        CareerPathNode: "NODE",
        CareerGuidanceQuestions: "QUESTION",
      };
      this.resourceType = map[doc.targetModel] || doc.targetModel || this.resourceType;
    }

    if (!this.resourceId && doc.targetId) {
      this.resourceId = doc.targetId;
    }

    // If action is not one of the allowed enum values, set to UNKNOWN to avoid validation failure
    const allowed = careerGuidanceAuditLogSchema.path("action").enumValues || [];
    if (this.action && !allowed.includes(this.action)) {
      this.action = "UNKNOWN";
    }
  } catch (err) {
    // ignore mapping errors and let validation handle them
  }

  next();
});

const CareerGuidanceAuditLog = mongoose.model(
  "CareerGuidanceAuditLog",
  careerGuidanceAuditLogSchema
);

export default CareerGuidanceAuditLog;