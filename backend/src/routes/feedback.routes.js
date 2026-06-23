const router = require("express").Router();

const { requireAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  createFeedbackSchema,
  listFeedbackQuerySchema,
} = require("../validators/feedback.validators");
const { createFeedback, fetchFeedback } = require("../controllers/feedback.controller");

// Submit feedback (any authenticated user)
router.post("/", requireAuth, validate({ body: createFeedbackSchema }), createFeedback);

// Get paginated feedback for the organization (any authenticated user)
router.get("/", requireAuth, validate({ query: listFeedbackQuerySchema }), fetchFeedback);

module.exports = router;
