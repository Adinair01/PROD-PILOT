const Feedback = require("../models/feedback.model");
const { analyzeSentiment } = require("./sentiment.service");

const submitFeedback = async (user, { message }) => {

  const analysis = analyzeSentiment(message);

  const feedback = await Feedback.create({
    organizationId: user.orgId,
    userId: user.userId,
    role: user.role,
    message,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.score,
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