const {
  submitFeedback,
  getOrgFeedback,
} = require("../services/feedback.service");

const createFeedback = async (req, res, next) => {
  try {
    const result = await submitFeedback(req.user, req.body);

    res.status(201).json({
      message: "Feedback submitted",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const fetchFeedback = async (req, res, next) => {
  try {
    const data = await getOrgFeedback(req.user.orgId);

    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFeedback,
  fetchFeedback,
};