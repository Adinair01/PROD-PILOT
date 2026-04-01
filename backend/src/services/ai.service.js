const { HfInference } = require("@huggingface/inference");
const https = require("https");

// ─── HuggingFace — Sentiment only ───────────────────────────────────────────
const SENTIMENT_MODEL = "distilbert/distilbert-base-uncased-finetuned-sst-2-english";
const hf = new HfInference(process.env.HF_API_KEY);

const analyzeSentiment = async (text) => {
  try {
    const result = await hf.textClassification({ model: SENTIMENT_MODEL, inputs: text });
    const top = result[0];
    return { sentiment: top.label.toUpperCase(), score: parseFloat(top.score.toFixed(4)) };
  } catch (err) {
    console.error("[AI] HuggingFace sentiment error:", err.message);
    return { sentiment: "NEUTRAL", score: 0 };
  }
};

// ─── NVIDIA Mistral — Structured JSON summaries ──────────────────────────────
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const MISTRAL_MODEL = "mistralai/mistral-small-4-119b-2603";

/**
 * Calls NVIDIA Mistral via HTTPS and returns parsed JSON.
 * Forces JSON output via system prompt + response_format.
 */
const callMistral = (messages) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MISTRAL_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const options = {
      hostname: "integrate.api.nvidia.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          const content = parsed?.choices?.[0]?.message?.content;
          if (!content) return reject(new Error("Empty Mistral response"));
          resolve(JSON.parse(content));
        } catch (e) {
          reject(new Error("Failed to parse Mistral JSON: " + e.message));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

/**
 * Generates structured PM insights using Mistral.
 * Returns { technicalSummary, businessSummary, actionBlock }
 * Falls back to null on failure — caller handles graceful degradation.
 */
const generateStructuredInsights = async ({ sentimentStats, roleBreakdown, topIssues, roleSamples, affectedTeams }) => {
  try {
    const negPct = sentimentStats.total > 0
      ? Math.round((sentimentStats.NEGATIVE / sentimentStats.total) * 100)
      : 0;

    // Build a compact context string for the model
    const roleContext = roleBreakdown.map((r) => {
      const samples = roleSamples[r._id] || {};
      const neg = (samples.NEGATIVE || []).slice(0, 2).join(" | ");
      const pos = (samples.POSITIVE || []).slice(0, 1).join(" | ");
      return `${r._id} (${r.count} reports): NEG="${neg || "none"}" POS="${pos || "none"}"`;
    }).join("\n");

    const issueContext = topIssues.map((i) =>
      `"${i.issue}" x${i.mentions} [${i.severity}] by ${i.roles.join(", ")}`
    ).join(", ");

    // Pass pre-computed affected teams so Mistral doesn't hallucinate them
    const affectedTeamsStr = affectedTeams && affectedTeams.length > 0
      ? affectedTeams.join(", ")
      : "None identified";

    const systemPrompt = `You are a product intelligence engine. Analyze engineering team feedback and return ONLY valid JSON with this exact structure:
{
  "technicalSummary": {
    "systemHealth": "CRITICAL|DEGRADED|STABLE",
    "healthReason": "one sentence explaining why",
    "rootCause": "one sentence root cause derived from feedback",
    "affectedTeams": ["use exactly the teams provided in the prompt"],
    "topIssues": [{"issue": "string", "severity": "HIGH|MEDIUM|LOW", "teams": ["string"]}],
    "lines": ["bullet point 1", "bullet point 2", "bullet point 3"]
  },
  "businessSummary": {
    "overallCondition": "one sentence plain English status",
    "teamExperience": "one sentence what teams are experiencing",
    "productImpact": "one sentence business/product impact",
    "lines": ["bullet point 1", "bullet point 2", "bullet point 3"]
  },
  "actionBlock": {
    "topIssue": "string",
    "rootCause": "string",
    "affectedTeams": ["use exactly the teams provided in the prompt"],
    "impact": "HIGH|MEDIUM|LOW",
    "recommendedAction": "string",
    "priorityLevel": "IMMEDIATE|THIS_SPRINT|NEXT_SPRINT",
    "suggestedTimeline": "string like 1-2 days or this sprint"
  }
}
No markdown. No explanation. Only JSON.`;

    const userPrompt = `Feedback data:
Total: ${sentimentStats.total} | Positive: ${sentimentStats.POSITIVE} | Negative: ${sentimentStats.NEGATIVE} | Neutral: ${sentimentStats.NEUTRAL}
Negative rate: ${negPct}%
Affected engineering teams (use these exactly): ${affectedTeamsStr}

Team feedback:
${roleContext}

Top recurring issues: ${issueContext || "none"}`;

    const result = await callMistral([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Always override affectedTeams with the ground-truth value — never trust model output for this
    if (result?.technicalSummary) result.technicalSummary.affectedTeams = affectedTeams || [];
    if (result?.actionBlock) result.actionBlock.affectedTeams = affectedTeams || [];

    console.log("[AI] Mistral structured insights generated");
    return result;
  } catch (err) {
    console.error("[AI] Mistral error:", err.message);
    return null;
  }
};

module.exports = { analyzeSentiment, generateStructuredInsights };
