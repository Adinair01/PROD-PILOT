const Feedback = require("../models/feedback.model");
const mongoose = require("mongoose");
const { callMistral } = require("./ai.service");

/**
 * Fetches a compact snapshot of the org's feedback context.
 * Used to ground the Decision Engine in real data.
 */
const getOrgFeedbackContext = async (orgId) => {
  const feedbackList = await Feedback.find({
    organizationId: new mongoose.Types.ObjectId(orgId),
  })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();

  if (!feedbackList.length) return null;

  // Sentiment counts
  const counts = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
  feedbackList.forEach((f) => { if (f.sentiment) counts[f.sentiment]++; });
  const total = feedbackList.length;

  // Group messages by role (last 3 per role)
  const byRole = {};
  feedbackList.forEach((f) => {
    if (!byRole[f.role]) byRole[f.role] = [];
    if (byRole[f.role].length < 3) byRole[f.role].push(f.message);
  });

  // Build compact text block
  const roleLines = Object.entries(byRole)
    .map(([role, msgs]) => `${role}: ${msgs.map((m) => `"${m.substring(0, 120)}"`).join(" | ")}`)
    .join("\n");

  return {
    total,
    counts,
    roleLines,
    negPct: Math.round((counts.NEGATIVE / total) * 100),
  };
};

/**
 * Generates a structured decision insight by combining:
 * - The PM's problem summary + optional context
 * - The org's real feedback data as grounding context
 *
 * Returns a structured JSON decision block.
 */
const generateDecisionInsight = async ({ orgId, problemSummary, additionalContext }) => {
  const feedbackCtx = await getOrgFeedbackContext(orgId);

  const feedbackBlock = feedbackCtx
    ? `LIVE FEEDBACK CONTEXT (${feedbackCtx.total} entries — ${feedbackCtx.negPct}% negative):
${feedbackCtx.roleLines}`
    : "No feedback data available for this organization yet.";

  const systemPrompt = `You are a senior product decision intelligence engine. You have access to real engineering team feedback from the organization. Your job is to analyze the PM's stated problem in the context of that feedback and return a structured, actionable decision plan.

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "decisionTitle": "short title for this decision (max 8 words)",
  "confidence": "HIGH|MEDIUM|LOW",
  "rootCause": "one precise sentence identifying the root cause based on feedback + problem",
  "impact": "HIGH|MEDIUM|LOW",
  "affectedTeams": ["list of teams involved based on feedback"],
  "priorityLevel": "IMMEDIATE|THIS_SPRINT|NEXT_SPRINT",
  "recommendedActions": [
    { "action": "string", "owner": "team name", "timeline": "e.g. 24 hours" },
    { "action": "string", "owner": "team name", "timeline": "e.g. this sprint" }
  ],
  "riskIfIgnored": "one sentence on what happens if this is not addressed",
  "feedbackSignals": ["up to 3 direct quotes or paraphrases from team feedback that support this decision"],
  "edgeCases": [
    {
      "scenario": "short name for this edge case (max 6 words)",
      "description": "one sentence describing what could go wrong or be missed",
      "mitigation": "one sentence on how to handle or prevent it"
    }
  ],
  "summary": "2-3 sentence plain English summary for stakeholders"
}

For edgeCases: identify 2-4 realistic scenarios that could undermine the recommended actions or arise during implementation. Focus on technical risks, team dependency failures, timeline slippage, or assumptions that may not hold.`;

  const userPrompt = `PM PROBLEM STATEMENT:
${problemSummary}

${additionalContext ? `ADDITIONAL CONTEXT FROM PM:\n${additionalContext}\n\n` : ""}${feedbackBlock}`;

  const result = await callMistral([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return result;
};

module.exports = { generateDecisionInsight, getOrgFeedbackContext };
