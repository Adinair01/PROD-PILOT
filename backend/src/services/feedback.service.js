const Feedback = require("../models/feedback.model");
const { analyzeSentiment } = require("./ai.service");
const { logger } = require("../utils/logger");

// Map ADMIN role to PM for feedback attribution — org creator is always the PM
const ROLE_DISPLAY_MAP = {
  ADMIN: "PM",
};

const submitFeedback = async (user, { message }) => {
  // Normalize ADMIN -> PM so feedback is attributed correctly
  const role = ROLE_DISPLAY_MAP[user.role] || user.role;

  // AI-powered sentiment analysis (falls back to NEUTRAL on failure)
  const analysis = await analyzeSentiment(message);

  const feedback = await Feedback.create({
    organizationId: user.orgId,
    userId: user.userId,
    role,
    message,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.score,
  });

  logger.debug(
    { feedbackId: feedback._id, orgId: user.orgId, role, sentiment: feedback.sentiment },
    "Feedback created"
  );

  return feedback;
};

/**
 * Returns a paginated, org-scoped slice of feedback (newest first) plus
 * pagination metadata, so list endpoints never return an unbounded collection.
 */
const getOrgFeedback = async (orgId, { page = 1, limit = 50 } = {}) => {
  const filter = { organizationId: orgId };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Feedback.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  submitFeedback,
  getOrgFeedback,
};
