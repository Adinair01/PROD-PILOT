const router = require("express").Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const {
  createFeedback,
  fetchFeedback,
} = require("../controllers/feedback.controller");

// Submit feedback (any authenticated user)
router.post("/", requireAuth, createFeedback);

// Get all feedback for organization (any authenticated user)
router.get("/", requireAuth, fetchFeedback);

module.exports = router;
