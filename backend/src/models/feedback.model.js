const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    sentiment: {
      type: String,
      enum: ["POSITIVE", "NEUTRAL", "NEGATIVE"],
    },

    sentimentScore: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Compound index matches the dominant query: org-scoped, sorted by recency.
feedbackSchema.index({ organizationId: 1, createdAt: -1 });

// Guards against OverwriteModelError when this module is evaluated more than
// once (e.g. Vitest/Vite's module graph can load the same CJS file twice).
const Feedback = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
