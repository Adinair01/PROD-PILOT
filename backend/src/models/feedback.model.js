const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
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

    role: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
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

feedbackSchema.index({ organizationId: 1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;