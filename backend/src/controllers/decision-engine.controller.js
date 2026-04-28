const { generateDecisionInsight, getOrgFeedbackContext } = require("../services/decision-engine.service");
const DecisionHistory = require("../models/decision-history.model");

/**
 * GET /v1/decision-engine/context
 */
const getContext = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const ctx = await getOrgFeedbackContext(orgId);

    if (!ctx) {
      return res.json({ hasData: false, total: 0, negPct: 0 });
    }

    res.json({ hasData: true, total: ctx.total, negPct: ctx.negPct, counts: ctx.counts });
  } catch (err) {
    console.error("[DecisionEngine] context error:", err.message);
    res.status(500).json({ error: "Failed to load feedback context." });
  }
};

/**
 * POST /v1/decision-engine/analyze
 * Generates insight and saves it to history.
 */
const analyze = async (req, res) => {
  try {
    const { orgId, userId } = req.user;
    const { problemSummary, context: additionalContext } = req.body;

    if (!problemSummary?.trim()) {
      return res.status(400).json({ error: "problemSummary is required." });
    }

    const result = await generateDecisionInsight({
      orgId,
      problemSummary: problemSummary.trim(),
      additionalContext: additionalContext?.trim() || "",
    });

    if (!result) {
      return res.status(502).json({ error: "AI service unavailable. Please try again." });
    }

    // Persist to history
    const saved = await DecisionHistory.create({
      organizationId: orgId,
      userId,
      problemSummary: problemSummary.trim(),
      additionalContext: additionalContext?.trim() || "",
      decision: result,
    });

    res.json({ success: true, decision: result, historyId: saved._id });
  } catch (err) {
    console.error("[DecisionEngine] analyze error:", err.message);
    res.status(500).json({ error: "Failed to generate decision insight." });
  }
};

/**
 * GET /v1/decision-engine/history
 * Returns all past decisions for this org, newest first.
 */
const getHistory = async (req, res) => {
  try {
    const orgId = req.user.orgId;

    const history = await DecisionHistory.find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id problemSummary decision.decisionTitle decision.priorityLevel decision.impact createdAt")
      .lean();

    res.json(history);
  } catch (err) {
    console.error("[DecisionEngine] history error:", err.message);
    res.status(500).json({ error: "Failed to load history." });
  }
};

/**
 * GET /v1/decision-engine/history/:id
 * Returns a single full history entry.
 */
const getHistoryEntry = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const entry = await DecisionHistory.findOne({
      _id: req.params.id,
      organizationId: orgId,
    }).lean();

    if (!entry) return res.status(404).json({ error: "Not found." });

    res.json(entry);
  } catch (err) {
    console.error("[DecisionEngine] history entry error:", err.message);
    res.status(500).json({ error: "Failed to load entry." });
  }
};

/**
 * DELETE /v1/decision-engine/history/:id
 */
const deleteHistoryEntry = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    await DecisionHistory.deleteOne({ _id: req.params.id, organizationId: orgId });
    res.json({ success: true });
  } catch (err) {
    console.error("[DecisionEngine] delete error:", err.message);
    res.status(500).json({ error: "Failed to delete entry." });
  }
};

module.exports = { getContext, analyze, getHistory, getHistoryEntry, deleteHistoryEntry };
