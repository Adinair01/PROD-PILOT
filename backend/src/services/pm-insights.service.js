const Feedback = require("../models/feedback.model");
const mongoose = require("mongoose");
const { generateStructuredInsights } = require("./ai.service");

// ─── Role metadata ───────────────────────────────────────────────────────────

const ROLE_META = {
  QA:    { label: "Quality Assurance Team" },
  FE:    { label: "Frontend Engineering Team" },
  BE:    { label: "Backend Engineering Team" },
  DATA:  { label: "Data Engineering Team" },
  PM:    { label: "Product Management Team" },
  ADMIN: { label: "Product Management Team" },
};

// Engineering roles only — PM and ADMIN are never "affected teams"
const ENGINEERING_ROLES = new Set(["QA", "FE", "BE", "DATA"]);

// Used for cluster-level team attribution — includes ALL roles so no team shows as "Not identified"
const ROLE_LABEL_MAP = {
  QA:    "QA Team",
  FE:    "Frontend Team",
  BE:    "Backend Team",
  DATA:  "Data Team",
  PM:    "Product Management Team",
  ADMIN: "Product Management Team",
};

// For summary display (broader — includes PM label for context lines)
const roleLabel = (id) => ROLE_META[id]?.label || id;

/**
 * Derives affected teams directly from feedback documents.
 * Only includes engineering roles (QA, FE, BE, DATA).
 * Returns unique readable labels, e.g. ["QA Team", "Backend Team"].
 */
const getAffectedTeams = (feedbackList) => {
  const roles = new Set(
    feedbackList
      .map((f) => f.role)
      .filter((r) => ENGINEERING_ROLES.has(r))
  );
  // ROLE_LABEL_MAP covers all roles now, so this will always resolve correctly
  return Array.from(roles).map((r) => ROLE_LABEL_MAP[r] || r);
};

// ─── Aggregation helpers ─────────────────────────────────────────────────────

const getSentimentStats = async (orgId) => {
  const stats = await Feedback.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
    { $group: { _id: "$sentiment", count: { $sum: 1 } } },
  ]);
  const result = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0, total: 0 };
  stats.forEach((s) => { if (s._id) result[s._id] = s.count; });
  result.total = result.POSITIVE + result.NEGATIVE + result.NEUTRAL;
  return result;
};

const getRoleBreakdown = async (orgId) => {
  return Feedback.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
    { $group: { _id: "$role", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

const getTimelineStats = async (orgId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return Feedback.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(orgId), createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        feedbackCount: { $sum: 1 },
        negativeCount: { $sum: { $cond: [{ $eq: ["$sentiment", "NEGATIVE"] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", feedbackCount: 1, negativeCount: 1, _id: 0 } },
  ]);
};

const getRoleFeedbackSamples = async (orgId) => {
  const items = await Feedback.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const byRole = {};
  items.forEach((f) => {
    if (!byRole[f.role]) byRole[f.role] = { POSITIVE: [], NEGATIVE: [], NEUTRAL: [] };
    if (byRole[f.role][f.sentiment]) byRole[f.role][f.sentiment].push(f.message);
  });
  return byRole;
};

// ─── Feedback Clustering ─────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the","a","an","is","it","in","on","at","to","for","of","and","or","but","not",
  "with","this","that","are","was","were","be","been","have","has","had","do","does",
  "did","will","would","could","should","may","might","i","we","you","they","he","she",
  "our","your","their","my","also","very","just","more","some","when","what","which",
  "there","been","from","after","before","about","into","than","then","them","these",
]);

// Phrase patterns that map to a clean cluster label
const CLUSTER_PATTERNS = [
  { label: "API Failure",        terms: ["api","endpoint","route","request","response","500","404"] },
  { label: "Database Issue",     terms: ["database","db","mongo","query","write","read","storage","persist"] },
  { label: "Performance",        terms: ["slow","lag","latency","performance","timeout","freeze","loading"] },
  { label: "UI / UX Bug",        terms: ["ui","button","screen","layout","mobile","responsive","css","render","component"] },
  { label: "Data Pipeline",      terms: ["etl","pipeline","aggregation","data","analytics","inconsistent","report"] },
  { label: "Authentication",     terms: ["login","auth","token","session","logout","permission","access"] },
  { label: "Test Failures",      terms: ["test","regression","coverage","bug","fail","broken","flaky"] },
  { label: "Server Error",       terms: ["crash","exception","error","server","500","exception","stack"] },
];

const clusterFeedback = (feedbackList) => {
  const clusters = {};

  CLUSTER_PATTERNS.forEach((p) => {
    clusters[p.label] = { issue: p.label, count: 0, severity: "LOW", roles: new Set(), messages: [] };
  });

  feedbackList.forEach((f) => {
    const lower = f.message.toLowerCase();
    CLUSTER_PATTERNS.forEach((p) => {
      if (p.terms.some((t) => lower.includes(t))) {
        const c = clusters[p.label];
        c.count++;
        // Track ALL roles — we want to show exactly who reported this issue
        if (f.role) c.roles.add(f.role);
        if (c.messages.length < 2) c.messages.push(f.message);
      }
    });
  });

  return Object.values(clusters)
    .filter((c) => c.count > 0)
    .map((c) => ({
      issue: c.issue,
      count: c.count,
      severity: c.count >= 4 ? "HIGH" : c.count >= 2 ? "MEDIUM" : "LOW",
      roles: c.roles.size > 0
        ? Array.from(c.roles).map((r) => ROLE_LABEL_MAP[r] || r)
        : ["Unknown Team"],
      sample: c.messages[0] || null,
    }))
    .sort((a, b) => b.count - a.count);
};

// ─── Fallback summaries (when Mistral is unavailable) ────────────────────────

const buildFallbackInsights = (sentimentStats, roleBreakdown, clusters, roleSamples, allFeedback) => {
  const negPct = sentimentStats.total > 0
    ? Math.round((sentimentStats.NEGATIVE / sentimentStats.total) * 100) : 0;
  const posPct = 100 - negPct;

  const healthStatus = negPct > 50 ? "CRITICAL" : negPct > 25 ? "DEGRADED" : "STABLE";

  // Derive affected teams from actual feedback roles — engineering only, no PM/ADMIN
  const affectedTeams = getAffectedTeams(allFeedback);

  const topCluster = clusters[0];

  const technicalSummary = {
    systemHealth: healthStatus,
    healthReason: `${negPct}% of submitted feedback is negative across ${roleBreakdown.length} team(s).`,
    rootCause: topCluster
      ? `Recurring issues around "${topCluster.issue}" reported by ${topCluster.roles.join(", ")}.`
      : "No dominant root cause identified from current feedback volume.",
    affectedTeams,
    topIssues: clusters.slice(0, 3).map((c) => ({ issue: c.issue, severity: c.severity, teams: c.roles })),
    lines: [
      `System Health: ${healthStatus}. ${negPct}% negative feedback rate across ${sentimentStats.total} total entries.`,
      ...roleBreakdown.map((r) => {
        const neg = (roleSamples[r._id]?.NEGATIVE || []);
        const pos = (roleSamples[r._id]?.POSITIVE || []);
        if (neg.length > 0) return `${roleLabel(r._id)} reported ${neg.length} issue(s). Latest: "${neg[0].substring(0, 100)}${neg[0].length > 100 ? "..." : ""}"`;
        if (pos.length > 0) return `${roleLabel(r._id)} submitted ${pos.length} positive update(s). No blockers reported.`;
        return null;
      }).filter(Boolean),
    ],
  };

  const businessSummary = {
    overallCondition: negPct > 50
      ? "More than half the team is reporting problems that need immediate attention."
      : negPct > 25
      ? "Some teams are experiencing issues that should be addressed this sprint."
      : `The team is largely satisfied with ${posPct}% positive responses.`,
    teamExperience: affectedTeams.length > 0
      ? `${affectedTeams.join(", ")} ${affectedTeams.length > 1 ? "teams are" : "team is"} experiencing friction that is slowing down delivery.`
      : "No teams are currently reporting significant concerns.",
    productImpact: topCluster
      ? `Issues around "${topCluster.issue}" are directly affecting product stability and team velocity.`
      : "No critical product impact detected at this time.",
    lines: [
      `Based on ${sentimentStats.total} responses from ${roleBreakdown.length} team(s).`,
      ...roleBreakdown.map((r) => {
        const neg = (roleSamples[r._id]?.NEGATIVE || []);
        if (neg.length > 0) return `${roleLabel(r._id)} team raised ${neg.length} concern(s). Example: "${neg[0].substring(0, 90)}${neg[0].length > 90 ? "..." : ""}"`;
        return null;
      }).filter(Boolean),
    ],
  };

  const actionBlock = {
    topIssue: topCluster?.issue || "No critical issue identified",
    rootCause: technicalSummary.rootCause,
    affectedTeams,
    impact: negPct > 50 ? "HIGH" : negPct > 25 ? "MEDIUM" : "LOW",
    recommendedAction: topCluster
      ? `Prioritize resolution of "${topCluster.issue}" with ${topCluster.roles.join(" and ")} team(s) in the next sprint.`
      : "Continue monitoring. No immediate action required.",
    priorityLevel: negPct > 50 ? "IMMEDIATE" : negPct > 25 ? "THIS_SPRINT" : "NEXT_SPRINT",
    suggestedTimeline: negPct > 50 ? "1 to 2 days" : negPct > 25 ? "This sprint" : "Next sprint",
  };

  return { technicalSummary, businessSummary, actionBlock };
};

// ─── Insight Cache (per org) ─────────────────────────────────────────────────
// Keyed by orgId. Stores { result, feedbackCount } so we only regenerate
// when the total feedback count changes (i.e. new feedback was submitted).

const insightCache = new Map();

// ─── Main Export ─────────────────────────────────────────────────────────────

const generatePMInsights = async (orgId) => {
  const [sentimentStats, roleBreakdown, timelineStats, roleSamples, allNegFeedback] =
    await Promise.all([
      getSentimentStats(orgId),
      getRoleBreakdown(orgId),
      getTimelineStats(orgId),
      getRoleFeedbackSamples(orgId),
      Feedback.find({ organizationId: new mongoose.Types.ObjectId(orgId) })
        .sort({ createdAt: -1 }).limit(100).lean(),
    ]);

  // ── Cache check: return cached result if feedback count hasn't changed ──
  const currentCount = sentimentStats.total;
  const cached = insightCache.get(orgId);
  if (cached && cached.feedbackCount === currentCount) {
    return cached.result;
  }

  const healthScore = sentimentStats.total === 0
    ? 100
    : Math.round(((sentimentStats.POSITIVE - sentimentStats.NEGATIVE) / sentimentStats.total) * 100);

  const riskLevel = sentimentStats.NEGATIVE > sentimentStats.POSITIVE
    ? "High"
    : sentimentStats.NEGATIVE > sentimentStats.total * 0.4
    ? "Moderate"
    : "Stable";

  // Cluster all feedback
  const clusters = clusterFeedback(allNegFeedback);

  // Derive affected teams from actual feedback — engineering roles only, no PM/ADMIN
  const affectedTeams = getAffectedTeams(allNegFeedback);

  // Build top issues from clusters (for backward compat)
  const topIssues = clusters.slice(0, 5).map((c) => ({
    issue: c.issue,
    mentions: c.count,
    roles: c.roles,
    severity: c.severity.charAt(0) + c.severity.slice(1).toLowerCase(),
  }));

  // Try Mistral first, fall back to rule-based
  let aiInsights = null;
  if (sentimentStats.total > 0) {
    aiInsights = await generateStructuredInsights({
      sentimentStats,
      roleBreakdown,
      topIssues: clusters.slice(0, 5),
      roleSamples,
      affectedTeams,
    });
  }

  const { technicalSummary, businessSummary, actionBlock } = aiInsights
    ? aiInsights
    : buildFallbackInsights(sentimentStats, roleBreakdown, clusters, roleSamples, allNegFeedback);

  const result = {
    healthScore,
    riskLevel,
    totalFeedback: sentimentStats.total,
    technicalSummary,
    businessSummary,
    actionBlock,
    clusters,
    sentimentStats,
    roleBreakdown,
    trend: timelineStats,
    // keep legacy keys so existing frontend doesn't break
    analytics: {
      sentimentStats,
      roleBreakdown,
      timelineStats,
    },
    topIssues,
  };

  // Store in cache keyed by orgId + current feedback count
  insightCache.set(orgId, { feedbackCount: currentCount, result });

  return result;
};

module.exports = { generatePMInsights };
