const express = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  getContext,
  analyze,
  getHistory,
  getHistoryEntry,
  deleteHistoryEntry,
} = require("../controllers/decision-engine.controller");

const router = express.Router();
router.use(requireAuth);

router.get("/context",        getContext);
router.post("/analyze",       analyze);
router.get("/history",        getHistory);
router.get("/history/:id",    getHistoryEntry);
router.delete("/history/:id", deleteHistoryEntry);

module.exports = router;
