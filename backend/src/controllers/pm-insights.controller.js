const { generatePMInsights } = require("../services/pm-insights.service");

const getPMInsights = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    console.log("[PM Insights] orgId:", orgId);
    const insights = await generatePMInsights(orgId);
    console.log("[PM Insights] healthScore:", insights.healthScore, "total:", insights.analytics.sentimentStats.total);
    res.json(insights);
  } catch (err) {
    console.error("[PM Insights] Error:", err.message);
    next(err);
  }
};

module.exports = { getPMInsights };
