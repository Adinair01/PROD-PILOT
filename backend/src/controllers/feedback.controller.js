const { submitFeedback, getOrgFeedback } = require("../services/feedback.service");
const { asyncHandler } = require("../utils/async-handler");

const createFeedback = asyncHandler(async (req, res) => {
  const result = await submitFeedback(req.user, req.body);
  res.status(201).json({ message: "Feedback submitted", data: result });
});

const fetchFeedback = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { items, pagination } = await getOrgFeedback(req.user.orgId, { page, limit });
  res.json({ items, pagination });
});

module.exports = {
  createFeedback,
  fetchFeedback,
};
