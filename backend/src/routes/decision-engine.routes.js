const express = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const { validate, objectIdParam } = require("../middlewares/validate.middleware");
const { analyzeSchema } = require("../validators/decision-engine.validators");
const {
  getContext,
  analyze,
  getHistory,
  getHistoryEntry,
  deleteHistoryEntry,
} = require("../controllers/decision-engine.controller");

const router = express.Router();
router.use(requireAuth);

router.get("/context", getContext);
router.post("/analyze", validate({ body: analyzeSchema }), analyze);
router.get("/history", getHistory);
router.get("/history/:id", validate({ params: objectIdParam("id") }), getHistoryEntry);
router.delete("/history/:id", validate({ params: objectIdParam("id") }), deleteHistoryEntry);

module.exports = router;
