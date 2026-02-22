const {
  getSentimentStats,
  getRoleBreakdown,
  getPriorityFeedback,
  getClusters,
} = require("../services/analytics.service");

const getInsights = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights };