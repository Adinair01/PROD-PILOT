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

  // Overrides the SameSite attribute on auth cookies. Left unset it derives
  // from COOKIE_SECURE ("none" in production, "lax" locally) — the value
  // required when the browser talks to the backend's domain directly. Once the
  // frontend proxies /v1 through its own origin (frontend/vercel.json), the
  // cookies are first-party and this should be set to "lax", which actually
  // defends against CSRF instead of opting out of it.
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).optional(),
  // Number of reverse proxies in front of the app, used to resolve the real
  // client IP from X-Forwarded-For. Render's own load balancer is 1 hop. Once
  // the frontend proxies /v1 through Vercel there are 2, and leaving this at 1
  // makes every request resolve to Vercel's egress IP — collapsing all users
  // into a single rate-limit bucket and handing out spurious 429s.
  TRUST_PROXY_HOPS: z.coerce.number().int().positive().default(1),

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

  // Google Sign-In — optional, unset routes respond 502 instead of crashing.
  GOOGLE_CLIENT_ID: z.string().optional(),
});

/**
 * Variables the app no longer reads, mapped to what actually controls that
 * behavior. These are worse than useless: `JWT_SECRET` sitting in a dashboard
 * reads like *the* signing key, so a reasonable person could rotate it, see
 * nothing change, and conclude the deploy is broken. Tokens are signed with
 * JWT_ACCESS_SECRET.
 */
const RETIRED_VARS = {
  JWT_SECRET: "tokens are signed with JWT_ACCESS_SECRET",
  JWT_EXPIRES_IN: "the access-token lifetime is ACCESS_TOKEN_TTL",
};

// Set by the platform or tooling, never by us — not worth reporting as strays.
const PLATFORM_VARS = new Set(["NODE_VERSION", "NODE_OPTIONS", "NODE_PATH"]);

/**
 * Flags env vars that were plainly *meant* for this app — they share a prefix
 * with something in the schema — but that nothing reads. Catches typos
 * (`CORS_ORIGINS`, `COOKIE_SAMESITE_`) and leftovers from earlier designs,
 * both of which otherwise fail silently by simply having no effect.
 */
function findStrayVars(processEnv, schemaKeys) {
  const known = new Set(schemaKeys);
  const prefixes = new Set(
    schemaKeys.map((k) => k.split("_")[0]).filter((p) => p !== "NODE" && p !== "PORT")
  );

  return Object.keys(processEnv)
    .filter((k) => !known.has(k) && !PLATFORM_VARS.has(k) && !(k in RETIRED_VARS))
    .filter((k) => prefixes.has(k.split("_")[0]))
    .sort();
}

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

  // Warn, never exit: a stale variable is a config smell, not a reason to take
  // the service down. Silence during tests, which set their own env.
  if (env.NODE_ENV !== "test") {
    for (const [name, guidance] of Object.entries(RETIRED_VARS)) {
      if (process.env[name] !== undefined) {
        console.warn(`[env] ${name} is set but nothing reads it — ${guidance}. Safe to delete.`);
      }
    }
    const strays = findStrayVars(process.env, Object.keys(envSchema.shape));
    if (strays.length) {
      console.warn(
        `[env] set but unread, check for a typo: ${strays.join(", ")}. ` +
          `Recognized: ${Object.keys(envSchema.shape).join(", ")}`
      );
    }
  }

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

module.exports = { env, REFRESH_COOKIE_PATH, findStrayVars, RETIRED_VARS };
