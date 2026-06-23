const { z } = require("zod");

const MAX_MESSAGE_LENGTH = 2000;

const createFeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Feedback message is required")
    .max(MAX_MESSAGE_LENGTH, `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`),
});

const listFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

module.exports = { createFeedbackSchema, listFeedbackQuerySchema, MAX_MESSAGE_LENGTH };
