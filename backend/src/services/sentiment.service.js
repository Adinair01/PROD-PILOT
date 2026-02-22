function analyzeSentiment(text) {
  const lower = text.toLowerCase();

  if (lower.includes("bug") || lower.includes("slow") || lower.includes("issue")) {
    return { sentiment: "NEGATIVE", score: -1 };
  }

  if (lower.includes("good") || lower.includes("great") || lower.includes("improve")) {
    return { sentiment: "POSITIVE", score: 1 };
  }

  return { sentiment: "NEUTRAL", score: 0 };
}

module.exports = { analyzeSentiment };