const {
  generateDecisionInsight,
  getOrgFeedbackContext,
} = require("../services/decision-engine.service");
const DecisionHistory = require("../models/decision-history.model");
const { asyncHandler } = require("../utils/async-handler");
const { ApiError } = require("../utils/api-error");

/** GET /v1/decision-engine/context */
const getContext = asyncHandler(async (req, res) => {
  const ctx = await getOrgFeedbackContext(req.user.orgId);

  if (!ctx) {
    return res.json({ hasData: false, total: 0, negPct: 0 });
  }

  res.json({
    hasData: true,
    total: ctx.total,
    negPct: ctx.negPct,
    counts: ctx.counts,
  });
});

/**
 * POST /v1/decision-engine/analyze
 * Generates an insight (grounded in org feedback) and persists it to history.
 * Input is validated by the route's validate() middleware.
 */
const analyze = asyncHandler(async (req, res) => {
  const { orgId, userId } = req.user;
  const { problemSummary, context: additionalContext } = req.body;

  const result = await generateDecisionInsight({
    orgId,
    problemSummary,
    additionalContext,
  });

  if (!result) {
    throw ApiError.badGateway("AI service unavailable. Please try again.");
  }

  const saved = await DecisionHistory.create({
    organizationId: orgId,
    userId,
    problemSummary,
    additionalContext,
    decision: result,
  });

  res.status(201).json({ success: true, decision: result, historyId: saved._id });
});

/** GET /v1/decision-engine/history — all past decisions for the org, newest first. */
const getHistory = asyncHandler(async (req, res) => {
  const history = await DecisionHistory.find({ organizationId: req.user.orgId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "_id problemSummary decision.decisionTitle decision.priorityLevel decision.impact createdAt"
    )
    .lean();

  res.json(history);
});

/** GET /v1/decision-engine/history/:id — a single full history entry. */
const getHistoryEntry = asyncHandler(async (req, res) => {
  const entry = await DecisionHistory.findOne({
    _id: req.params.id,
    organizationId: req.user.orgId,
  }).lean();

  if (!entry) throw ApiError.notFound("Decision not found");

  res.json(entry);
});

/** DELETE /v1/decision-engine/history/:id */
const deleteHistoryEntry = asyncHandler(async (req, res) => {
  const { deletedCount } = await DecisionHistory.deleteOne({
    _id: req.params.id,
    organizationId: req.user.orgId,
  });

  if (deletedCount === 0) throw ApiError.notFound("Decision not found");

  res.json({ success: true });
});

module.exports = { getContext, analyze, getHistory, getHistoryEntry, deleteHistoryEntry };
