const { z } = require("zod");

const MAX_PROBLEM_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 4000;

const analyzeSchema = z.object({
  problemSummary: z
    .string()
    .trim()
    .min(1, "problemSummary is required")
    .max(MAX_PROBLEM_LENGTH, `problemSummary must be ${MAX_PROBLEM_LENGTH} characters or fewer`),
  context: z
    .string()
    .trim()
    .max(MAX_CONTEXT_LENGTH, `context must be ${MAX_CONTEXT_LENGTH} characters or fewer`)
    .optional()
    .default(""),
});

module.exports = { analyzeSchema, MAX_PROBLEM_LENGTH, MAX_CONTEXT_LENGTH };
