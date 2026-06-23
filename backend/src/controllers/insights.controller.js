const { generateInsights } = require("../services/analytics.service");
const { asyncHandler } = require("../utils/async-handler");

const getInsights = asyncHandler(async (req, res) => {
  const insights = await generateInsights(req.user.orgId);
  res.json(insights);
});

module.exports = { getInsights };
