const { generateDecisionInsight, getOrgFeedbackContext } = require("../services/decision-engine.service");

/**
 * GET /v1/decision-engine/context
 * Returns a lightweight summary of the org's feedback context
 * so the frontend can show "X feedback entries loaded" before submission.
 */
const getContext = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const ctx = await getOrgFeedbackContext(orgId);

    if (!ctx) {
      return res.json({
        hasData: false,
        total: 0,
        negPct: 0,
        message: "No feedback data found for this organization.",
      });
    }

    res.json({
      hasData: true,
      total: ctx.total,
      negPct: ctx.negPct,
      counts: ctx.counts,
    });
  } catch (err) {
    console.error("[DecisionEngine] context error:", err.message);
    res.status(500).json({ error: "Failed to load feedback context." });
  }
};

/**
 * POST /v1/decision-engine/analyze
 * Body: { problemSummary, context? }
 * Returns a structured AI decision block grounded in org feedback.
 */
const analyze = async (req, res) => {
  try {
    const orgId = req.user.orgId;
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

    res.json({ success: true, decision: result });
  } catch (err) {
    console.error("[DecisionEngine] analyze error:", err.message);
    res.status(500).json({ error: "Failed to generate decision insight." });
  }
};

module.exports = { getContext, analyze };
