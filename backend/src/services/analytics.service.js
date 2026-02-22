const Feedback = require("../models/feedback.model");

const getSentimentStats = async (orgId) => {
  const stats = await Feedback.aggregate([
    { $match: { organizationId: orgId } },
    {
      $group: {
        _id: "$sentiment",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = stats.reduce((sum, s) => sum + s.count, 0);

  const result = {
    total,
    POSITIVE: 0,
    NEGATIVE: 0,
    NEUTRAL: 0,
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
  });

  return result;
};

const getRoleBreakdown = async (orgId) => {
  return Feedback.aggregate([
    { $match: { organizationId: orgId } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);
};

const calculatePriorityScore = (feedback) => {
  let base = 0;

  if (feedback.sentiment === "NEGATIVE") base = 5;
  if (feedback.sentiment === "NEUTRAL") base = 2;
  if (feedback.sentiment === "POSITIVE") base = 1;

  const ageInHours =
    (Date.now() - new Date(feedback.createdAt).getTime()) / (1000 * 60 * 60);

  const recencyBoost = ageInHours < 24 ? 2 : 0;

  return base + recencyBoost;
};

const getPriorityFeedback = async (orgId) => {
  const feedbacks = await Feedback.find({ organizationId: orgId });

  return feedbacks
    .map((f) => ({
      ...f.toObject(),
      priorityScore: calculatePriorityScore(f),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

const getClusters = async (orgId) => {
  const feedbacks = await Feedback.find({ organizationId: orgId });

  const clusters = {};

  feedbacks.forEach((f) => {
    const keyword = f.message.split(" ")[0].toLowerCase();

    if (!clusters[keyword]) {
      clusters[keyword] = [];
    }

    clusters[keyword].push(f);
  });

  return clusters;
};

const calculateHealthScore = (sentimentStats) => {
  const { total, POSITIVE, NEGATIVE } = sentimentStats;

  if (total === 0) return 100;

  const score = ((POSITIVE - NEGATIVE) / total) * 100;

  return Math.round(score);
};

const detectRisk = (sentimentStats) => {
  if (sentimentStats.NEGATIVE > sentimentStats.POSITIVE) {
    return "High Risk – Negative feedback dominating";
  }

  if (sentimentStats.NEGATIVE > sentimentStats.total * 0.4) {
    return "Moderate Risk – Significant dissatisfaction";
  }

  return "Stable";
};

const detectMostImpactedRole = (roleBreakdown) => {
  if (!roleBreakdown.length) return null;

  const sorted = [...roleBreakdown].sort((a, b) => b.count - a.count);

  return sorted[0]._id;
};

const generateInsights = async (orgId) => {
  const [sentimentStats, roleBreakdown, priorityFeedback] = await Promise.all([
    getSentimentStats(orgId),
    getRoleBreakdown(orgId),
    getPriorityFeedback(orgId),
  ]);

  const healthScore = calculateHealthScore(sentimentStats);
  const riskLevel = detectRisk(sentimentStats);
  const impactedRole = detectMostImpactedRole(roleBreakdown);

  return {
    healthScore,
    riskLevel,
    impactedRole,
    topPriority: priorityFeedback.slice(0, 3),
    sentimentStats,
    roleBreakdown,
  };
};

module.exports = {
  getSentimentStats,
  getRoleBreakdown,
  getPriorityFeedback,
  getClusters,
  generateInsights,
};
