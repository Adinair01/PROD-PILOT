const { generateInsights } = require("../services/analytics.service");

const getInsights = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;

    const insights = await generateInsights(orgId);

    res.json(insights);
  } catch (err) {
    next(err);
  }
};

module.exports = { getInsights };