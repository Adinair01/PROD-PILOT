const { generatePMInsights } = require("../services/pm-insights.service");
const { asyncHandler } = require("../utils/async-handler");

const getPMInsights = asyncHandler(async (req, res) => {
  const insights = await generatePMInsights(req.user.orgId);
  res.json(insights);
});

module.exports = { getPMInsights };
