const { generateInsights } = require("../services/analytics.service");

const getInsights = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    
    console.log("=== INSIGHTS REQUEST ===");
    console.log("User:", req.user);
    console.log("Organization ID:", orgId);

    const insights = await generateInsights(orgId);
    
    console.log("Generated insights:", {
      healthScore: insights.healthScore,
      riskLevel: insights.riskLevel,
      totalFeedback: insights.sentimentStats.total,
      roleBreakdown: insights.roleBreakdown,
      topPriorityCount: insights.topPriority.length
    });

    res.json(insights);
  } catch (err) {
    console.error("Error generating insights:", err);
    next(err);
  }
};

module.exports = { getInsights };