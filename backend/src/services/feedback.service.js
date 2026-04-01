const Feedback = require("../models/feedback.model");
const { analyzeSentiment } = require("./ai.service");

// Map ADMIN role to PM for feedback attribution — org creator is always the PM
const ROLE_DISPLAY_MAP = {
  ADMIN: "PM",
};

const submitFeedback = async (user, { message }) => {
  console.log("=== SUBMITTING FEEDBACK ===");
  console.log("User:", user);
  console.log("Message:", message);

  // Normalize ADMIN -> PM so feedback is attributed correctly
  const role = ROLE_DISPLAY_MAP[user.role] || user.role;

  // AI-powered sentiment analysis (falls back to NEUTRAL on failure)
  const analysis = await analyzeSentiment(message);
  console.log("[Feedback] Sentiment result:", analysis);

  const feedback = await Feedback.create({
    organizationId: user.orgId,
    userId: user.userId,
    role,
    message,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.score,
  });

  console.log("Feedback created:", {
    id: feedback._id,
    organizationId: feedback.organizationId,
    role: feedback.role,
    sentiment: feedback.sentiment,
    sentimentScore: feedback.sentimentScore,
  });

  return feedback;
};

const getOrgFeedback = async (orgId) => {
  return Feedback.find({ organizationId: orgId }).sort({ createdAt: -1 });
};

module.exports = {
  submitFeedback,
  getOrgFeedback,
};