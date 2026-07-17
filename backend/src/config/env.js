const { z } = require("zod");

/**
 * Centralized, validated environment configuration.
 *
 * Every required variable is checked once at boot. If anything is missing or
 * malformed the process exits immediately with a readable error, instead of
 * failing lazily at request time (e.g. signing a JWT with an undefined secret).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),

  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // AI keys are optional — the app degrades gracefully without them.
  HF_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),

  // Email delivery (password reset) — optional, degrades to a logged no-op.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("PROD PILOT <onboarding@resend.dev>"),

  // Error monitoring — optional, Sentry SDK no-ops without a DSN.
  SENTRY_DSN: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }

  const env = parsed.data;

  return {
    ...env,
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    corsOrigins: env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

const env = loadEnv();

// Refresh-token cookies are only sent to the refresh endpoint to limit exposure.
const REFRESH_COOKIE_PATH = "/v1/auth/refresh";

module.exports = { env, REFRESH_COOKIE_PATH };
