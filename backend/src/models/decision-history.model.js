const mongoose = require("mongoose");

const decisionHistorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemSummary: {
      type: String,
      required: true,
      trim: true,
    },
    additionalContext: {
      type: String,
      default: "",
      trim: true,
    },
    decision: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast org-scoped history queries
decisionHistorySchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model("DecisionHistory", decisionHistorySchema);
