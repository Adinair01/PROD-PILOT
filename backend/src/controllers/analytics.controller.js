const {
  getSentimentStats,
  getRoleBreakdown,
  getPriorityFeedback,
  getClusters,
} = require("../services/analytics.service");
const { asyncHandler } = require("../utils/async-handler");

const getInsights = asyncHandler(async (req, res) => {
  const orgId = req.user.orgId;

  const [sentiment, roles, priority, clusters] = await Promise.all([
    getSentimentStats(orgId),
    getRoleBreakdown(orgId),
    getPriorityFeedback(orgId),
    getClusters(orgId),
  ]);

  res.json({
    sentiment,
    roles,
    topPriority: priority.slice(0, 5),
    clusters,
  });
});

module.exports = { getInsights };
