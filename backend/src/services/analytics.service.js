const mongoose = require("mongoose");
const Feedback = require("../models/feedback.model");

// Aggregation $match does not auto-cast strings to ObjectId (unlike find()),
// so org ids from the JWT must be cast explicitly or the match returns nothing.
const orgObjectId = (orgId) => new mongoose.Types.ObjectId(orgId);

const getSentimentStats = async (orgId) => {
  const stats = await Feedback.aggregate([
    { $match: { organizationId: orgObjectId(orgId) } },
    {
      $group: {
        _id: "$sentiment",
        count: { $sum: 1 },
      },
    },
  ]);

  // Compute total from the three known buckets only — feedback with a null
  // sentiment is excluded so percentages stay accurate.
  const result = {
    POSITIVE: 0,
    NEGATIVE: 0,
    NEUTRAL: 0,
    total: 0,
  };

  stats.forEach((s) => {
    if (s._id && s._id in result) result[s._id] = s.count;
  });

  result.total = result.POSITIVE + result.NEGATIVE + result.NEUTRAL;
  return result;
};

const getRoleBreakdown = async (orgId) => {
  return Feedback.aggregate([
    { $match: { organizationId: orgObjectId(orgId) } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Scores feedback by negative sentiment + recency. Old feedback decays so
 * the "priority" list stays current instead of being dominated by stale entries.
 */
const calculatePriorityScore = (feedback) => {
  let base = 0;

  if (feedback.sentiment === "NEGATIVE") base = 5;
  if (feedback.sentiment === "NEUTRAL") base = 2;
  if (feedback.sentiment === "POSITIVE") base = 1;

  const ageInHours = (Date.now() - new Date(feedback.createdAt).getTime()) / (1000 * 60 * 60);

  const recencyBoost = ageInHours < 24 ? 2 : 0;

  // Decay: halve the score for feedback older than 7 days
  const ageDecay = ageInHours > 168 ? 0.5 : 1;

  return (base + recencyBoost) * ageDecay;
};

/** Max feedback docs to load for priority scoring and clustering. */
const QUERY_LIMIT = 200;

const getPriorityFeedback = async (orgId) => {
  const feedbacks = await Feedback.find({ organizationId: orgId })
    .sort({ createdAt: -1 })
    .limit(QUERY_LIMIT)
    .lean();

  return feedbacks
    .map((f) => ({
      ...f,
      priorityScore: calculatePriorityScore(f),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

// ─── Keyword-based clustering (replaces the naive first-word approach) ───────

const CLUSTER_PATTERNS = [
  {
    label: "API Failure",
    terms: ["api", "endpoint", "route", "request", "response", "500", "404"],
  },
  {
    label: "Database Issue",
    terms: ["database", "db", "mongo", "query", "write", "read", "storage", "persist"],
  },
  {
    label: "Performance",
    terms: ["slow", "lag", "latency", "performance", "timeout", "freeze", "loading"],
  },
  {
    label: "UI / UX Bug",
    terms: ["ui", "button", "screen", "layout", "mobile", "responsive", "css", "render", "component"],
  },
  {
    label: "Data Pipeline",
    terms: ["etl", "pipeline", "aggregation", "data", "analytics", "inconsistent", "report"],
  },
  {
    label: "Authentication",
    terms: ["login", "auth", "token", "session", "logout", "permission", "access"],
  },
  {
    label: "Test Failures",
    terms: ["test", "regression", "coverage", "bug", "fail", "broken", "flaky"],
  },
  {
    label: "Server Error",
    terms: ["crash", "exception", "error", "server", "500", "exception", "stack"],
  },
];

const getClusters = async (orgId) => {
  const feedbacks = await Feedback.find({ organizationId: orgId })
    .sort({ createdAt: -1 })
    .limit(QUERY_LIMIT)
    .lean();

  const clusters = {};

  feedbacks.forEach((f) => {
    const lower = f.message.toLowerCase();
    CLUSTER_PATTERNS.forEach((p) => {
      if (p.terms.some((t) => lower.includes(t))) {
        if (!clusters[p.label]) {
          clusters[p.label] = { issue: p.label, messages: [], count: 0 };
        }
        clusters[p.label].count++;
        if (clusters[p.label].messages.length < 3) {
          clusters[p.label].messages.push(f.message);
        }
      }
    });
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
